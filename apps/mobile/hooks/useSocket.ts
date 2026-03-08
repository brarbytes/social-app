import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { createSocket, disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const addTypingUser = useChatStore((s) => s.addTypingUser);
  const removeTypingUser = useChatStore((s) => s.removeTypingUser);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const sock = createSocket(accessToken);
    socketRef.current = sock;

    sock.on("connect", () => setIsConnected(true));
    sock.on("disconnect", () => setIsConnected(false));

    sock.on("chat:message:new", () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    });

    sock.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notification"] });
    });

    sock.on("presence:update", () => {
      queryClient.invalidateQueries({ queryKey: ["presence"] });
    });

    sock.on("chat:typing:start", (data: { conversationId: string; userId: string }) => {
      addTypingUser(data.conversationId, data.userId);
    });

    sock.on("chat:typing:stop", (data: { conversationId: string; userId: string }) => {
      removeTypingUser(data.conversationId, data.userId);
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, accessToken, queryClient, addTypingUser, removeTypingUser]);

  return { socket: socketRef.current, isConnected };
}
