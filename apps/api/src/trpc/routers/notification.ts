import { z } from "zod";
import { router, protectedProcedure } from "../index.js";

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;

      const notifications = await ctx.prisma.notification.findMany({
        where: { userId: ctx.user.id },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const next = notifications.pop()!;
        nextCursor = next.id;
      }

      return { notifications, nextCursor };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: { userId: ctx.user.id, read: false },
    });
    return { count };
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.notification.update({
        where: { id: input.id, userId: ctx.user.id },
        data: { read: true },
      });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  }),
});
