import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
} from "@social-app/shared";
import { router, protectedProcedure } from "../index.js";
import { notificationQueue } from "../../jobs/queue.js";

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  helpfulnessScore: true,
};

export const friendRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await ctx.prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: ctx.user.id },
          { receiverId: ctx.user.id },
        ],
      },
      include: {
        requester: { select: userSelect },
        receiver: { select: userSelect },
      },
      orderBy: { updatedAt: "desc" },
    });

    return friendships.map((f) => {
      const friend =
        f.requesterId === ctx.user.id ? f.receiver : f.requester;
      return { friendshipId: f.id, ...friend };
    });
  }),

  pendingRequests: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.friendship.findMany({
      where: { receiverId: ctx.user.id, status: "PENDING" },
      include: { requester: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
  }),

  sentRequests: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.friendship.findMany({
      where: { requesterId: ctx.user.id, status: "PENDING" },
      include: { receiver: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
  }),

  send: protectedProcedure
    .input(sendFriendRequestSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.receiverId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot friend yourself" });
      }

      const existing = await ctx.prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: ctx.user.id, receiverId: input.receiverId },
            { requesterId: input.receiverId, receiverId: ctx.user.id },
          ],
        },
      });

      if (existing) {
        if (existing.status === "ACCEPTED") {
          throw new TRPCError({ code: "CONFLICT", message: "Already friends" });
        }
        if (existing.status === "PENDING") {
          throw new TRPCError({ code: "CONFLICT", message: "Request already pending" });
        }
      }

      const friendship = await ctx.prisma.friendship.create({
        data: { requesterId: ctx.user.id, receiverId: input.receiverId },
      });

      await notificationQueue.add("notify", {
        userId: input.receiverId,
        type: "FRIEND_REQUEST",
        title: "New friend request",
        body: `wants to connect with you`,
        data: { friendshipId: friendship.id, userId: ctx.user.id },
      });

      return friendship;
    }),

  respond: protectedProcedure
    .input(respondFriendRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const friendship = await ctx.prisma.friendship.findUnique({
        where: { id: input.friendshipId },
      });

      if (!friendship || friendship.receiverId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (friendship.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already responded" });
      }

      const updated = await ctx.prisma.friendship.update({
        where: { id: input.friendshipId },
        data: { status: input.status },
      });

      if (input.status === "ACCEPTED") {
        await notificationQueue.add("notify", {
          userId: friendship.requesterId,
          type: "FRIEND_ACCEPTED",
          title: "Friend request accepted!",
          body: `You are now friends`,
          data: { userId: ctx.user.id },
        });
      }

      return updated;
    }),

  remove: protectedProcedure
    .input(z.object({ friendshipId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const friendship = await ctx.prisma.friendship.findUnique({
        where: { id: input.friendshipId },
      });

      if (
        !friendship ||
        (friendship.requesterId !== ctx.user.id &&
          friendship.receiverId !== ctx.user.id)
      ) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.friendship.delete({ where: { id: input.friendshipId } });
      return { success: true };
    }),
});
