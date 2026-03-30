export type KnowledgeSourceType = "DOCUMENTS" | "MEETING_LOGS" | "SCHEDULES";

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "지식 동기화 요청을 처리하지 못했습니다.");
  }

  return data;
}

export async function indexKnowledge(
  sourceId: string,
  sourceType: KnowledgeSourceType,
  content: string,
  options?: {
    title?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const response = await fetch("/api/knowledge/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceId,
      sourceType,
      title: options?.title,
      content,
      metadata: options?.metadata,
    }),
  });

  return parseResponse(response);
}

export async function removeKnowledge(
  sourceId: string,
  sourceType: KnowledgeSourceType,
) {
  const response = await fetch("/api/knowledge/sync", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceId,
      sourceType,
    }),
  });

  if (!response.ok) {
    await parseResponse(response);
  }
}
