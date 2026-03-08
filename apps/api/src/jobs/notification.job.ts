import { Worker } from "bullmq";
import type { Server } from "socket.io";
import { prisma } from "@social-app/db";
import { createRedisConnection } from "../lib/redis.js";

interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function createNotificationWorker(io: Server) {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    async (job) => {
      const { userId, type, title, body, data } = job.data;

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data ?? undefined,
        },
      });

      io.to(userId).emit("notification:new", notification);
    },
    { connection: createRedisConnection() },
  );

  worker.on("failed", (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err.message);
  });

  return worker;
}
