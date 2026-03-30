import "server-only";

export type AiModelPurpose =
  | "chat"
  | "embedding"
  | "meetingRefine"
  | "stt";

const DEFAULT_MODELS: Record<AiModelPurpose, string> = {
  chat: "openai/gpt-4o-mini",
  embedding: "openai/text-embedding-3-small",
  meetingRefine: "google/gemini-2.0-flash-001",
  stt: "openai/gpt-4o-audio-preview",
};

const MODEL_ALIASES: Record<string, string> = {
  openai: "openai/gpt-4o-mini",
  google: "google/gemini-2.0-flash-001",
  gemini: "google/gemini-2.0-flash-001",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "text-embedding-3-small": "openai/text-embedding-3-small",
  "text-embedding-3-large": "openai/text-embedding-3-large",
  "gpt-4o-audio-preview": "openai/gpt-4o-audio-preview",
  "gpt-audio-mini": "openai/gpt-audio-mini",
  "gemini-1.5-flash": "google/gemini-2.0-flash-001",
  "gemini-flash-1.5": "google/gemini-2.0-flash-001",
  "gemini-1.5-flash-8b": "google/gemini-2.0-flash-001",
  "gemini-flash-1.5-8b": "google/gemini-2.0-flash-001",
  "gemini-2.0-flash": "google/gemini-2.0-flash-001",
  "gemini-flash-2.0": "google/gemini-2.0-flash-001",
};

export function getDefaultModel(purpose: AiModelPurpose) {
  return DEFAULT_MODELS[purpose];
}

export function normalizeModelId(
  modelId: string | null | undefined,
  purpose: AiModelPurpose,
) {
  let normalized = modelId?.trim();

  if (!normalized) {
    return getDefaultModel(purpose);
  }

  // Obsolete ID mapping — force move to 2.0 to avoid 404
  if (
    normalized.includes("gemini-flash-1.5") ||
    normalized.includes("gemini-1.5-flash")
  ) {
    normalized = "google/gemini-2.0-flash-001";
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  return MODEL_ALIASES[normalized] ?? normalized;
}
