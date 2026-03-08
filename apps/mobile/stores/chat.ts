import { create } from "zustand";

interface ChatState {
  activeConversationId: string | null;
  typingUsers: Map<string, string[]>;
  setActiveConversation: (id: string | null) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTyping: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: null,
  typingUsers: new Map(),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addTypingUser: (conversationId, userId) => {
    const current = new Map(get().typingUsers);
    const users = current.get(conversationId) || [];
    if (!users.includes(userId)) {
      current.set(conversationId, [...users, userId]);
      set({ typingUsers: current });
    }
  },

  removeTypingUser: (conversationId, userId) => {
    const current = new Map(get().typingUsers);
    const users = current.get(conversationId) || [];
    current.set(
      conversationId,
      users.filter((u) => u !== userId)
    );
    set({ typingUsers: current });
  },

  clearTyping: (conversationId) => {
    const current = new Map(get().typingUsers);
    current.delete(conversationId);
    set({ typingUsers: current });
  },
}));
