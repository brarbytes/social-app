import { Queue } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";

const connection = createRedisConnection();

export const notificationQueue = new Queue("notifications", { connection });

export const mediaQueue = new Queue("media", { connection });
