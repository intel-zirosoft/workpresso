import "server-only";

import { createEmbedding } from "@/lib/ai/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type JsonValue,
  type KnowledgeSourceType,
  type RemoveKnowledgeSourceInput,
  type UpsertKnowledgeSourceInput,
  removeKnowledgeSourceInputSchema,
  upsertKnowledgeSourceInputSchema,
} from "@/features/pod-c/services/knowledge-contract";

export type {
  JsonValue,
  KnowledgeSourceType,
  RemoveKnowledgeSourceInput,
  UpsertKnowledgeSourceInput,
} from "@/features/pod-c/services/knowledge-contract";

function buildEmbeddingInput(
  title: string | null | undefined,
  content: string,
) {
  return [title?.trim(), content.trim()].filter(Boolean).join("\n\n");
}

export function buildScheduleKnowledgeContent(input: {
  title: string;
  startTime: string;
  endTime: string;
  type?: string | null;
}) {
  return [
    `일정 제목: ${input.title}`,
    `일정 유형: ${input.type ?? "TASK"}`,
    `시작 시간: ${input.startTime}`,
    `종료 시간: ${input.endTime}`,
  ].join("\n");
}

export function buildMeetingLogKnowledgeContent(input: {
  title?: string | null;
  summary?: string | null;
  participants?: string[] | null;
  actionItems?: Array<Record<string, JsonValue>> | null;
  transcript?: string | null;
}) {
  const actionItems =
    input.actionItems
      ?.map((item) => {
        const task = typeof item.task === "string" ? item.task : null;
        const assignee =
          typeof item.assignee === "string" ? item.assignee : null;
        const dueDate =
          typeof item.due_date === "string" ? item.due_date : null;

        return [
          task,
          assignee ? `담당: ${assignee}` : null,
          dueDate ? `기한: ${dueDate}` : null,
        ]
          .filter(Boolean)
          .join(" / ");
      })
      .filter(Boolean)
      .join("\n") ?? "";

  return [
    input.title ? `회의 제목: ${input.title}` : null,
    input.summary ? `회의 요약: ${input.summary}` : null,
    input.participants?.length
      ? `참여자: ${input.participants.join(", ")}`
      : null,
    actionItems ? `액션 아이템:\n${actionItems}` : null,
    input.transcript ? `원문:\n${input.transcript}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function upsertKnowledgeSource(input: UpsertKnowledgeSourceInput) {
  const parsedInput = upsertKnowledgeSourceInputSchema.parse(input);
  const content = parsedInput.content.trim();

  if (!content) {
    return;
  }

  const supabase = createAdminClient();
  const embeddingInput = buildEmbeddingInput(parsedInput.title, content);
  const { embedding } = await createEmbedding(embeddingInput);

  if (!embedding) {
    throw new Error("임베딩 생성 결과가 비어 있습니다.");
  }

  const syncedAt = new Date().toISOString();
  const { error } = await supabase.from("knowledge_vectors").upsert(
    {
      source_type: parsedInput.sourceType,
      source_id: parsedInput.sourceId,
      embedding,
      metadata: {
        title: parsedInput.title ?? "",
        content,
        source_type: parsedInput.sourceType,
        source_id: parsedInput.sourceId,
        synced_at: syncedAt,
        ...(parsedInput.metadata ?? {}),
      },
      updated_at: syncedAt,
    },
    { onConflict: "source_type,source_id" },
  );

  if (error) {
    throw new Error(`지식 벡터를 저장하지 못했습니다: ${error.message}`);
  }
}

export async function removeKnowledgeSource(input: RemoveKnowledgeSourceInput) {
  const parsedInput = removeKnowledgeSourceInputSchema.parse(input);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("knowledge_vectors")
    .delete()
    .eq("source_type", parsedInput.sourceType)
    .eq("source_id", parsedInput.sourceId);

  if (error) {
    throw new Error(`지식 벡터를 삭제하지 못했습니다: ${error.message}`);
  }
}
