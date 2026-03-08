import { z } from "zod";

export const sendConnectionSchema = z.object({
  receiverId: z.string().cuid(),
});

export const respondConnectionSchema = z.object({
  connectionId: z.string().cuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type SendConnectionInput = z.infer<typeof sendConnectionSchema>;
export type RespondConnectionInput = z.infer<typeof respondConnectionSchema>;
