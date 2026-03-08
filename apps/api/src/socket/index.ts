import type { Server } from "socket.io";
import { verifyAccessToken } from "../middleware/auth.js";
import { chatHandler } from "./chat.handler.js";
import { presenceHandler } from "./presence.handler.js";

export function setupSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const { userId } = verifyAccessToken(token);
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userId);

    chatHandler(io, socket);
    presenceHandler(io, socket);
  });
}
