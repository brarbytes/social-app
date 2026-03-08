import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(20).max(50000),
  tags: z.array(z.string()).max(5).default([]),
});

export const createAnswerSchema = z.object({
  questionId: z.string().cuid(),
  body: z.string().min(1).max(50000),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
