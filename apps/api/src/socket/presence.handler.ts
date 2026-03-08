import type { Server, Socket } from "socket.io";
import { redis } from "../lib/redis.js";

const ONLINE_SET = "users:online";

export function presenceHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  redis.sadd(ONLINE_SET, userId);
  io.emit("presence:update", { userId, status: "online" });

  socket.on("disconnect", async () => {
    const sockets = await io.in(userId).fetchSockets();
    if (sockets.length === 0) {
      await redis.srem(ONLINE_SET, userId);
      io.emit("presence:update", { userId, status: "offline" });
    }
  });
}

export async function getOnlineUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of userIds) {
    pipeline.sismember(ONLINE_SET, id);
  }
  const results = await pipeline.exec();
  if (!results) return [];

  return userIds.filter((_, i) => results[i]?.[1] === 1);
}
