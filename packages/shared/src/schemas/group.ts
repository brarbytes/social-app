import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).default("PUBLIC"),
  category: z.string().optional(),
});

export const updateGroupSchema = z.object({
  groupId: z.string().cuid(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).optional(),
  category: z.string().optional(),
});

export const joinGroupSchema = z.object({
  groupId: z.string().cuid(),
});

export const groupMemberActionSchema = z.object({
  groupId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.enum(["ADMIN", "MODERATOR", "CONTRIBUTOR"]).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
