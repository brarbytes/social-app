import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(20).max(50000),
  tags: z.array(z.string()).max(5).default([]),
  topicIds: z.array(z.string()).min(1).max(3),
  subTopicIds: z.array(z.string()).max(5).default([]),
  groupId: z.string().cuid().optional(),
});

export const createAnswerSchema = z.object({
  questionId: z.string().cuid(),
  body: z.string().min(1).max(50000),
});

export const acceptAnswerSchema = z.object({
  answerId: z.string().cuid(),
});

export const voteQuestionSchema = z.object({
  questionId: z.string().cuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const voteAnswerSchema = z.object({
  answerId: z.string().cuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type AcceptAnswerInput = z.infer<typeof acceptAnswerSchema>;
