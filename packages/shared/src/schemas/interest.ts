import { z } from "zod";

export const setInterestsSchema = z.object({
  interests: z.array(
    z.object({
      topicId: z.string().cuid(),
      subTopicIds: z.array(z.string().cuid()).default([]),
    })
  ),
});

export const topicSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
});

export const subTopicSchema = z.object({
  name: z.string().min(1).max(50),
  topicId: z.string().cuid(),
});

export type SetInterestsInput = z.infer<typeof setInterestsSchema>;
