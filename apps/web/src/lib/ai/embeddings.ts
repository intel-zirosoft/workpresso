import "server-only";

import { getResolvedAiConfig } from "@/lib/ai/config";
import { normalizeModelId } from "@/lib/ai/models";
import { createOpenRouterClient } from "@/lib/ai/openrouter";

export async function createEmbedding(
  input: string,
  options?: { model?: string; apiKeyOverride?: string },
) {
  const client = await createOpenRouterClient({
    apiKeyOverride: options?.apiKeyOverride,
  });
  const aiConfig = await getResolvedAiConfig();
  const model = normalizeModelId(
    options?.model ?? aiConfig.embeddingModel,
    "embedding",
  );

  const response = await client.embeddings.create({
    model,
    input,
    encoding_format: "float",
  });
  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("임베딩 생성 결과가 비어 있습니다.");
  }

  return { embedding, model };
}
