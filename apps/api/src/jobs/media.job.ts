import { Worker } from "bullmq";
import sharp from "sharp";
import { createRedisConnection } from "../lib/redis.js";
import { uploadFile } from "../lib/storage.js";

interface MediaJobData {
  buffer: number[];
  key: string;
  contentType: string;
  resize?: { width: number; height: number };
}

export function createMediaWorker() {
  const worker = new Worker<MediaJobData>(
    "media",
    async (job) => {
      const { buffer, key, contentType, resize } = job.data;

      let imageBuffer = Buffer.from(buffer);

      if (resize) {
        imageBuffer = await sharp(imageBuffer)
          .resize(resize.width, resize.height, { fit: "inside" })
          .toBuffer();
      }

      const url = await uploadFile(imageBuffer, key, contentType);
      console.log(`Media processed and uploaded: ${key} -> ${url}`);
      return { url };
    },
    { connection: createRedisConnection() },
  );

  worker.on("failed", (job, err) => {
    console.error(`Media job ${job?.id} failed:`, err.message);
  });

  return worker;
}
