import type { Server, Socket } from "socket.io";
import { prisma } from "@social-app/db";

export function chatHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  socket.on("chat:join", async (conversationId: string) => {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });
    if (member) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on("chat:leave", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on(
    "chat:message",
    async (data: { conversationId: string; content: string; clientId?: string }) => {
      const member = await prisma.conversationMember.findFirst({
        where: { conversationId: data.conversationId, userId },
      });
      if (!member) return;

      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      io.to(`conversation:${data.conversationId}`).emit("chat:message:new", {
        ...message,
        clientId: data.clientId,
      });
    }
  );

  socket.on("chat:typing:start", (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit("chat:typing:start", {
      userId,
      conversationId,
    });
  });

  socket.on("chat:typing:stop", (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit("chat:typing:stop", {
      userId,
      conversationId,
    });
  });
}
