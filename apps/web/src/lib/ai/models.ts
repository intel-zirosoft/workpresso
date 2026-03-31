import "server-only";

export type AiModelPurpose =
  | "chat"
  | "embedding"
  | "meetingRefine"
  | "stt";

const DEFAULT_MODELS: Record<AiModelPurpose, string> = {
  chat: "openai/gpt-4o-mini",
  embedding: "openai/text-embedding-3-small",
  meetingRefine: "google/gemini-flash-1.5",
  stt: "openai/gpt-4o-audio-preview",
};

const MODEL_ALIASES: Record<string, string> = {
  openai: "openai/gpt-4o-mini",
  google: "google/gemini-flash-1.5",
  gemini: "google/gemini-flash-1.5",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "text-embedding-3-small": "openai/text-embedding-3-small",
  "text-embedding-3-large": "openai/text-embedding-3-large",
  "gpt-4o-audio-preview": "openai/gpt-4o-audio-preview",
  "gpt-audio-mini": "openai/gpt-audio-mini",
  "gemini-1.5-flash": "google/gemini-flash-1.5",
  "gemini-flash-1.5": "google/gemini-flash-1.5",
  "gemini-1.5-flash-8b": "google/gemini-flash-1.5-8b",
  "gemini-flash-1.5-8b": "google/gemini-flash-1.5-8b",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
};

export function getDefaultModel(purpose: AiModelPurpose) {
  return DEFAULT_MODELS[purpose];
}

export function normalizeModelId(
  modelId: string | null | undefined,
  purpose: AiModelPurpose,
) {
  const normalized = modelId?.trim();

  if (!normalized) {
    return getDefaultModel(purpose);
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  return MODEL_ALIASES[normalized] ?? normalized;
}
