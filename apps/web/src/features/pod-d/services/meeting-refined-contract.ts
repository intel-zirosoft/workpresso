import { z } from "zod";

export const meetingRefinedActionItemSchema = z.object({
  task: z.string(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
});

export const meetingRefinedPayloadSchema = z.object({
  meetingLogId: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  participants: z.array(z.string()).default([]),
  actionItems: z.array(meetingRefinedActionItemSchema).default([]),
  transcript: z.string(),
  updatedAt: z.string().datetime(),
});

export type MeetingRefinedPayload = z.infer<typeof meetingRefinedPayloadSchema>;
