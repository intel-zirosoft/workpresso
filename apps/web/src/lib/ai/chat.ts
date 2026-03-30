import "server-only";

import { getResolvedAiConfig } from "@/lib/ai/config";
import { normalizeModelId } from "@/lib/ai/models";
import {
  createOpenRouterClient,
  createOpenRouterProvider,
} from "@/lib/ai/openrouter";

export async function getChatLanguageModel(options?: { model?: string }) {
  const aiConfig = await getResolvedAiConfig();
  const provider = await createOpenRouterProvider();
  const modelId = normalizeModelId(options?.model ?? aiConfig.chatModel, "chat");

  return provider(modelId);
}

export async function generateJsonObject<T>(input: {
  system?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  apiKeyOverride?: string;
}) {
  const client = await createOpenRouterClient({
    apiKeyOverride: input.apiKeyOverride,
  });
  const aiConfig = await getResolvedAiConfig();
  const model = normalizeModelId(
    input.model ?? aiConfig.meetingRefineModel,
    "meetingRefine",
  );

  const response = await client.chat.completions.create({
    model,
    temperature: input.temperature ?? 0,
    response_format: { type: "json_object" },
    messages: [
      ...(input.system
        ? [{ role: "system" as const, content: input.system }]
        : []),
      { role: "user", content: input.prompt },
    ],
  });
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("모델 응답이 비어 있습니다.");
  }

  return JSON.parse(content) as T;
}
