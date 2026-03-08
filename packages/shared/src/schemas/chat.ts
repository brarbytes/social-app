import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1).max(10000),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "FILE"]).default("TEXT"),
});

export const createConversationSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1),
  name: z.string().optional(),
  isGroup: z.boolean().default(false),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
