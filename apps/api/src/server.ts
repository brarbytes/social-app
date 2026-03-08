import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./env.js";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/index.js";
import { setupSocketHandlers } from "./socket/index.js";
import { createNotificationWorker } from "./jobs/notification.job.js";
import { createMediaWorker } from "./jobs/media.job.js";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true, credentials: true });

await fastify.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext },
});

fastify.get("/health", async () => ({ status: "ok" }));

const io = new SocketIOServer(fastify.server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

setupSocketHandlers(io);

createNotificationWorker(io);
createMediaWorker();

const shutdown = async () => {
  fastify.log.info("Shutting down...");
  io.close();
  await fastify.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

try {
  await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
