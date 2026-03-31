import { z } from "zod";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const knowledgeSourceTypeSchema = z.enum([
  "DOCUMENTS",
  "MEETING_LOGS",
  "SCHEDULES",
  "CHAT_THREADS",
]);

export const knowledgeMetadataSchema = z
  .record(z.string(), jsonValueSchema)
  .optional();

export const upsertKnowledgeSourceInputSchema = z.object({
  sourceType: knowledgeSourceTypeSchema,
  sourceId: z.string().uuid(),
  title: z.string().nullable().optional(),
  content: z.string(),
  metadata: knowledgeMetadataSchema,
});

export const removeKnowledgeSourceInputSchema = z.object({
  sourceType: knowledgeSourceTypeSchema,
  sourceId: z.string().uuid(),
});

export type KnowledgeSourceType = z.infer<typeof knowledgeSourceTypeSchema>;
export type UpsertKnowledgeSourceInput = z.infer<
  typeof upsertKnowledgeSourceInputSchema
>;
export type RemoveKnowledgeSourceInput = z.infer<
  typeof removeKnowledgeSourceInputSchema
>;
