import { TRPCError } from "@trpc/server";
import { sendConnectionSchema, respondConnectionSchema } from "@social-app/shared";
import { router, protectedProcedure } from "../index.js";

export const connectionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: ctx.user.id }, { receiverId: ctx.user.id }],
      },
      include: {
        sender: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
      },
    });

    return connections.map((conn) => ({
      ...conn,
      otherUser: conn.senderId === ctx.user.id ? conn.receiver : conn.sender,
    }));
  }),

  pending: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.connection.findMany({
      where: { receiverId: ctx.user.id, status: "PENDING" },
      include: {
        sender: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  sent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.connection.findMany({
      where: { senderId: ctx.user.id, status: "PENDING" },
      include: {
        receiver: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  send: protectedProcedure
    .input(sendConnectionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      if (input.receiverId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send a connection request to yourself",
        });
      }

      const existing = await ctx.prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: input.receiverId },
            { senderId: input.receiverId, receiverId: userId },
          ],
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Connection already exists",
        });
      }

      return ctx.prisma.connection.create({
        data: { senderId: userId, receiverId: input.receiverId },
      });
    }),

  respond: protectedProcedure
    .input(respondConnectionSchema)
    .mutation(async ({ input, ctx }) => {
      const connection = await ctx.prisma.connection.findUnique({
        where: { id: input.connectionId },
      });
      if (!connection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
      }
      if (connection.receiverId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your request to respond to" });
      }

      const updated = await ctx.prisma.connection.update({
        where: { id: input.connectionId },
        data: { status: input.status },
      });

      if (input.status === "ACCEPTED") {
        await ctx.prisma.$transaction([
          ctx.prisma.follow.upsert({
            where: {
              followerId_followingId: {
                followerId: connection.senderId,
                followingId: connection.receiverId,
              },
            },
            update: {},
            create: {
              followerId: connection.senderId,
              followingId: connection.receiverId,
            },
          }),
          ctx.prisma.follow.upsert({
            where: {
              followerId_followingId: {
                followerId: connection.receiverId,
                followingId: connection.senderId,
              },
            },
            update: {},
            create: {
              followerId: connection.receiverId,
              followingId: connection.senderId,
            },
          }),
        ]);
      }

      return updated;
    }),
});
