import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendMessageSchema, createConversationSchema } from "@social-app/shared";
import { router, protectedProcedure } from "../index.js";

export const chatRouter = router({
  conversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const conversations = await ctx.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, userdisplayName: true, displayName: true } },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0] ?? null,
      unreadCount: conv._count.messages,
      messages: undefined,
    }));
  }),

  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { conversationId, cursor, limit } = input;

      const messages = await ctx.prisma.message.findMany({
        where: { conversationId },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const next = messages.pop()!;
        nextCursor = next.id;
      }

      return { messages, nextCursor };
    }),

  createConversation: protectedProcedure
    .input(createConversationSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const memberIds = Array.from(new Set([userId, ...(input.memberIds ?? [])]));

      const conversation = await ctx.prisma.conversation.create({
        data: {
          name: input.name,
          members: {
            create: memberIds.map((id) => ({ userId: id })),
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      });

      return conversation;
    }),

  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const member = await ctx.prisma.conversationMember.findFirst({
        where: { conversationId: input.conversationId, userId },
      });
      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this conversation",
        });
      }

      const [message] = await ctx.prisma.$transaction([
        ctx.prisma.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: userId,
            content: input.content,
          },
          include: {
            sender: { select: { id: true, userdisplayName: true, displayName: true, avatarUrl: true } },
          },
        }),
        ctx.prisma.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      return message;
    }),
});
