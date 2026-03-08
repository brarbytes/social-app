import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const postIdSchema = z.object({
  id: z.string().cuid(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostIdInput = z.infer<typeof postIdSchema>;
