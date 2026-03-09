import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  receiverId: z.string().cuid(),
});

export const respondFriendRequestSchema = z.object({
  friendshipId: z.string().cuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
