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

fastify.get("/", async (_, reply) => {
  return reply
    .code(200)
    .type("text/html")
    .send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Social App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      padding: 24px;
      text-align: center;
    }
    h1 { font-size: 1.75rem; margin: 0 0 8px; font-weight: 700; }
    .sub { color: #94a3b8; margin-bottom: 32px; }
    .card {
      background: rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      margin-bottom: 24px;
    }
    .card h2 { font-size: 1.1rem; margin: 0 0 12px; color: #f8fafc; }
    .card p { margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; }
    code {
      background: rgba(0,0,0,0.3);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.9em;
    }
    .steps { text-align: left; margin: 16px 0 0; }
    .steps li { margin-bottom: 10px; color: #cbd5e1; }
    a {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 24px;
      background: #6366f1;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
    }
    a:hover { background: #4f46e5; }
    .links { margin-top: 24px; font-size: 0.9rem; }
    .links a { margin: 0 8px; background: transparent; color: #94a3b8; padding: 0; }
    .links a:hover { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Social App</h1>
  <p class="sub">You're on the API server</p>

  <div class="card">
    <h2>See the app like on iPhone</h2>
    <p>This URL is the backend only. The phone-style app runs separately.</p>
    <ol class="steps">
      <li>Open a terminal in the project folder.</li>
      <li>Use Node 20: <code>nvm use 20</code> or <code>fnm use</code></li>
      <li>Run: <code>pnpm dev:mobile</code></li>
      <li>Press <strong>w</strong> to open the app in your browser (phone-style layout), or scan the QR code with <strong>Expo Go</strong> on your iPhone.</li>
    </ol>
    <a href="http://localhost:8081" target="_blank" rel="noopener">Open app (after starting dev:mobile)</a>
  </div>

  <div class="links">
    <a href="/health">Health</a>
    <a href="/trpc">tRPC</a>
  </div>
</body>
</html>
    `);
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
