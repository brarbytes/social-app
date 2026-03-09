import { z } from "zod";
import { setInterestsSchema, topicSchema, subTopicSchema } from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";

export const interestRouter = router({
  topics: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: {
        subtopics: { orderBy: { name: "asc" } },
        _count: { select: { questions: true, userInterests: true } },
      },
    });
  }),

  myInterests: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.userInterest.findMany({
      where: { userId: ctx.user.id },
      include: {
        topic: { select: { id: true, name: true, slug: true, icon: true } },
        subTopic: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { score: "desc" },
    });
  }),

  myExpertise: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.userExpertise.findMany({
      where: { userId: ctx.user.id },
      include: {
        topic: { select: { id: true, name: true, slug: true, icon: true } },
        subTopic: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { points: "desc" },
    });
  }),

  userExpertise: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.userExpertise.findMany({
        where: { userId: input.userId },
        include: {
          topic: { select: { id: true, name: true, slug: true, icon: true } },
          subTopic: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { points: "desc" },
      });
    }),

  setInterests: protectedProcedure
    .input(setInterestsSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.userInterest.deleteMany({
        where: { userId: ctx.user.id, manual: true },
      });

      const data = input.interests.flatMap((i) => {
        const topLevel = {
          userId: ctx.user.id,
          topicId: i.topicId,
          subTopicId: null as string | null,
          manual: true,
          score: 1.0,
        };

        const subs = i.subTopicIds.map((subId) => ({
          userId: ctx.user.id,
          topicId: i.topicId,
          subTopicId: subId,
          manual: true,
          score: 1.0,
        }));

        return [topLevel, ...subs];
      });

      for (const d of data) {
        await ctx.prisma.userInterest.upsert({
          where: {
            userId_topicId_subTopicId: {
              userId: d.userId,
              topicId: d.topicId,
              subTopicId: d.subTopicId,
            },
          },
          update: { manual: true, score: Math.max(d.score, 1.0) },
          create: d,
        });
      }

      return { success: true };
    }),

  leaderboard: publicProcedure
    .input(
      z.object({
        topicId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      return ctx.prisma.userExpertise.findMany({
        where: {
          ...(input.topicId ? { topicId: input.topicId } : {}),
          subTopicId: null,
          points: { gt: 0 },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              helpfulnessScore: true,
            },
          },
          topic: { select: { id: true, name: true, slug: true, icon: true } },
        },
        orderBy: { points: "desc" },
        take: input.limit,
      });
    }),
});
