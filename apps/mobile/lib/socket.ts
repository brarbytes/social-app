import { io, Socket } from "socket.io-client";
import { API_URL } from "./trpc";

export let socket: Socket | null = null;

export function createSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
