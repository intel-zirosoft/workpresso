import { z } from "zod";

export const chatterLinkedObjectSchema = z.object({
  type: z.enum(["DOCUMENT", "SCHEDULE"]),
  id: z.string().uuid(),
});

export const threadCapturedMessageSchema = z.object({
  authorName: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(4000),
});

export const threadCapturedPayloadSchema = z.object({
  channelId: z.string().uuid(),
  threadId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(4000),
  messages: z.array(threadCapturedMessageSchema).min(1).max(50),
  linkedObjects: z.array(chatterLinkedObjectSchema).max(10).default([]),
  updatedAt: z.string().datetime(),
});

export const systemBriefingPayloadSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  title: z.string().trim().max(200).optional(),
  linkedObjects: z.array(chatterLinkedObjectSchema).max(10).default([]),
});

export type ChatterLinkedObjectInput = z.infer<typeof chatterLinkedObjectSchema>;
export type ThreadCapturedPayload = z.infer<typeof threadCapturedPayloadSchema>;
export type SystemBriefingPayload = z.infer<typeof systemBriefingPayloadSchema>;
