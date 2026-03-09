import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createQuestionSchema,
  createAnswerSchema,
  acceptAnswerSchema,
  voteQuestionSchema,
  voteAnswerSchema,
} from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";
import {
  findRespondersForQuestion,
  awardExpertisePoints,
  autoTrackInterest,
} from "../../services/matching.js";
import { notificationQueue } from "../../jobs/queue.js";

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  helpfulnessScore: true,
};

export const questionRouter = router({
  feed: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        topicId: z.string().optional(),
        subTopicId: z.string().optional(),
        groupId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const questions = await ctx.prisma.question.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          ...(input.topicId
            ? { topics: { some: { topicId: input.topicId } } }
            : {}),
          ...(input.subTopicId
            ? { topics: { some: { subTopicId: input.subTopicId } } }
            : {}),
          ...(input.groupId ? { groupId: input.groupId } : {}),
        },
        include: {
          author: { select: userSelect },
          topics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, icon: true } },
              subTopic: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { answers: true, votes: true } },
        },
      });

      let nextCursor: string | undefined;
      if (questions.length > input.limit) {
        const next = questions.pop();
        nextCursor = next?.id;
      }

      return { questions, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input.id },
        include: {
          author: { select: userSelect },
          topics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, icon: true } },
              subTopic: { select: { id: true, name: true, slug: true } },
            },
          },
          answers: {
            orderBy: [{ accepted: "desc" }, { createdAt: "asc" }],
            include: {
              author: { select: userSelect },
              _count: { select: { votes: true } },
            },
          },
          _count: { select: { answers: true } },
        },
      });

      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      const voteAgg = await ctx.prisma.vote.aggregate({
        where: { questionId: input.id },
        _sum: { value: true },
      });

      let userVote: number | null = null;
      if (ctx.user) {
        const vote = await ctx.prisma.vote.findUnique({
          where: { userId_questionId: { userId: ctx.user.id, questionId: input.id } },
        });
        userVote = vote?.value ?? null;
      }

      const answersWithVotes = await Promise.all(
        question.answers.map(async (a) => {
          const agg = await ctx.prisma.vote.aggregate({
            where: { answerId: a.id },
            _sum: { value: true },
          });
          return { ...a, voteCount: agg._sum.value ?? 0 };
        })
      );

      return {
        ...question,
        voteCount: voteAgg._sum.value ?? 0,
        userVote,
        answers: answersWithVotes,
      };
    }),

  create: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.create({
        data: {
          title: input.title,
          body: input.body,
          tags: input.tags,
          authorId: ctx.user.id,
          groupId: input.groupId,
          topics: {
            create: [
              ...input.topicIds.map((topicId) => ({ topicId })),
              ...input.subTopicIds.map((subTopicId) => {
                const topicId = input.topicIds[0];
                return { topicId, subTopicId };
              }),
            ],
          },
        },
      });

      await autoTrackInterest(ctx.user.id, input.topicIds, input.subTopicIds);

      const responders = await findRespondersForQuestion(
        question.id,
        input.topicIds,
        input.subTopicIds,
        ctx.user.id
      );

      if (responders.length > 0) {
        await ctx.prisma.questionRoute.createMany({
          data: responders.map((r) => ({
            questionId: question.id,
            userId: r.userId,
            isExpert: r.isExpert,
          })),
        });

        for (const r of responders) {
          await notificationQueue.add("notify", {
            userId: r.userId,
            type: "QUESTION_ROUTED",
            title: r.isExpert
              ? "Expert question for you"
              : "Someone needs your help",
            body: input.title,
            data: { questionId: question.id },
          });
        }
      }

      return question;
    }),

  answer: protectedProcedure
    .input(createAnswerSchema)
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input.questionId },
        include: { topics: true },
      });
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      const answer = await ctx.prisma.answer.create({
        data: {
          body: input.body,
          authorId: ctx.user.id,
          questionId: input.questionId,
        },
        include: { author: { select: userSelect } },
      });

      const topicIds = [...new Set(question.topics.map((t) => t.topicId))];
      const subTopicIds = question.topics
        .map((t) => t.subTopicId)
        .filter((id): id is string => id !== null);

      await awardExpertisePoints(ctx.user.id, topicIds, subTopicIds, 1, false);
      await autoTrackInterest(ctx.user.id, topicIds, subTopicIds);

      if (question.authorId !== ctx.user.id) {
        await notificationQueue.add("notify", {
          userId: question.authorId,
          type: "ANSWER",
          title: "New answer on your question",
          body: `${ctx.user.id} answered "${question.title}"`,
          data: { questionId: question.id },
        });
      }

      return answer;
    }),

  acceptAnswer: protectedProcedure
    .input(acceptAnswerSchema)
    .mutation(async ({ input, ctx }) => {
      const answer = await ctx.prisma.answer.findUnique({
        where: { id: input.answerId },
        include: { question: { include: { topics: true } } },
      });

      if (!answer) throw new TRPCError({ code: "NOT_FOUND" });
      if (answer.question.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
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

      const topicIds = [...new Set(answer.question.topics.map((t) => t.topicId))];
      const subTopicIds = answer.question.topics
        .map((t) => t.subTopicId)
        .filter((id): id is string => id !== null);

      await awardExpertisePoints(answer.authorId, topicIds, subTopicIds, 10, true);

      await notificationQueue.add("notify", {
        userId: answer.authorId,
        type: "ANSWER_ACCEPTED",
        title: "Your answer was accepted!",
        body: `+10 expertise points for "${answer.question.title}"`,
        data: { questionId: answer.questionId },
      });

      return { success: true };
    }),

  vote: protectedProcedure
    .input(voteQuestionSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.vote.findUnique({
        where: {
          userId_questionId: { userId: ctx.user.id, questionId: input.questionId },
        },
      });

      if (existing) {
        if (existing.value === input.value) {
          await ctx.prisma.vote.delete({ where: { id: existing.id } });
          return { removed: true };
        }
        await ctx.prisma.vote.update({
          where: { id: existing.id },
          data: { value: input.value },
        });
        return { updated: true };
      }

      await ctx.prisma.vote.create({
        data: {
          value: input.value,
          userId: ctx.user.id,
          questionId: input.questionId,
        },
      });
      return { created: true };
    }),

  voteAnswer: protectedProcedure
    .input(voteAnswerSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.vote.findUnique({
        where: {
          userId_answerId: { userId: ctx.user.id, answerId: input.answerId },
        },
      });

      if (existing) {
        if (existing.value === input.value) {
          await ctx.prisma.vote.delete({ where: { id: existing.id } });
          return { removed: true };
        }
        await ctx.prisma.vote.update({
          where: { id: existing.id },
          data: { value: input.value },
        });
        return { updated: true };
      }

      await ctx.prisma.vote.create({
        data: {
          value: input.value,
          userId: ctx.user.id,
          answerId: input.answerId,
        },
      });
      return { created: true };
    }),
});
