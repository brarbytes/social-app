import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createPostSchema, updatePostSchema, postIdSchema } from "@social-app/shared";
import { router, publicProcedure, protectedProcedure } from "../index.js";

export const postRouter = router({
  feed: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;
      const userId = ctx.user.id;

      const following = await ctx.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      const authorIds = [userId, ...followingIds];

      const posts = await ctx.prisma.post.findMany({
        where: { authorId: { in: authorIds } },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          votes: true,
          _count: { select: { comments: true } },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const next = posts.pop()!;
        nextCursor = next.id;
      }

      const postsWithMeta = posts.map((post) => {
        const voteCount = post.votes.reduce((sum, v) => sum + v.value, 0);
        const userVote = post.votes.find((v) => v.userId === userId)?.value ?? 0;
        const { votes, ...rest } = post;
        return {
          ...rest,
          voteCount,
          userVote,
          commentCount: rest._count.comments,
        };
      });

      return { posts: postsWithMeta, nextCursor };
    }),

  byId: publicProcedure
    .input(postIdSchema)
    .query(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          comments: {
            include: {
              author: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          votes: true,
        },
      });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      const voteCount = post.votes.reduce((sum, v) => sum + v.value, 0);
      const { votes, ...rest } = post;
      return { ...rest, voteCount };
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.post.create({
        data: { ...input, authorId: ctx.user.id },
      });
    }),

  delete: protectedProcedure
    .input(postIdSchema)
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findUnique({ where: { id: input.id } });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }
      await ctx.prisma.post.delete({ where: { id: input.id } });
      return { success: true };
    }),

  vote: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        value: z.number().int().min(-1).max(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { postId, value } = input;
      const userId = ctx.user.id;

      if (value === 0) {
        await ctx.prisma.vote.deleteMany({
          where: { postId, userId },
        });
      } else {
        await ctx.prisma.vote.upsert({
          where: { userId_postId: { userId, postId } },
          update: { value },
          create: { postId, userId, value },
        });
      }

      return { success: true };
    }),
});
