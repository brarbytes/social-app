import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createQuestionSchema, createAnswerSchema } from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";

export const questionRouter = router({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        sort: z.enum(["createdAt", "votes"]).default("createdAt"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit, sort } = input;

      const questions = await ctx.prisma.question.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: sort === "createdAt" ? { createdAt: "desc" } : { createdAt: "desc" },
        include: {
          author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          votes: true,
          _count: { select: { answers: true } },
        },
      });

      let nextCursor: string | undefined;
      if (questions.length > limit) {
        const next = questions.pop()!;
        nextCursor = next.id;
      }

      const questionsWithMeta = questions.map((q) => {
        const voteCount = q.votes.reduce((sum, v) => sum + v.value, 0);
        const { votes, ...rest } = q;
        return { ...rest, voteCount, answerCount: rest._count.answers };
      });

      if (sort === "votes") {
        questionsWithMeta.sort((a, b) => b.voteCount - a.voteCount);
      }

      return { questions: questionsWithMeta, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          answers: {
            include: {
              author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
              votes: true,
            },
            orderBy: { createdAt: "asc" },
          },
          comments: {
            include: {
              author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          votes: true,
        },
      });
      if (!question) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
      }

      const voteCount = question.votes.reduce((sum, v) => sum + v.value, 0);
      const answers = question.answers.map((a) => {
        const answerVoteCount = a.votes.reduce((sum, v) => sum + v.value, 0);
        const { votes, ...rest } = a;
        return { ...rest, voteCount: answerVoteCount };
      });
      const { votes, answers: _, ...rest } = question;
      return { ...rest, voteCount, answers };
    }),

  create: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.question.create({
        data: { ...input, authorId: ctx.user.id },
      });
    }),

  answer: protectedProcedure
    .input(createAnswerSchema)
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input.questionId },
      });
      if (!question) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
      }

      return ctx.prisma.answer.create({
        data: {
          questionId: input.questionId,
          content: input.content,
          authorId: ctx.user.id,
        },
      });
    }),

  acceptAnswer: protectedProcedure
    .input(z.object({ answerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const answer = await ctx.prisma.answer.findUnique({
        where: { id: input.answerId },
        include: { question: true },
      });
      if (!answer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Answer not found" });
      }
      if (answer.question.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the question author can accept an answer",
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.answer.update({
          where: { id: input.answerId },
          data: { accepted: true },
        }),
        ctx.prisma.question.update({
          where: { id: answer.questionId },
          data: { solved: true },
        }),
      ]);

      return { success: true };
    }),

  vote: protectedProcedure
    .input(
      z.object({
        questionId: z.string().optional(),
        answerId: z.string().optional(),
        value: z.number().int().min(-1).max(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { questionId, answerId, value } = input;
      const userId = ctx.user.id;

      if (!questionId && !answerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either questionId or answerId is required",
        });
      }

      if (value === 0) {
        await ctx.prisma.vote.deleteMany({
          where: { userId, questionId, answerId },
        });
      } else {
        const where = questionId
          ? { userId_questionId: { userId, questionId } }
          : { userId_answerId: { userId, answerId: answerId! } };

        await ctx.prisma.vote.upsert({
          where,
          update: { value },
          create: { userId, questionId, answerId, value },
        });
      }

      return { success: true };
    }),
});
