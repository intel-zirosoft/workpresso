import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultModel, normalizeModelId } from "@/lib/ai/models";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  getDecryptedExtensionSecret,
  SYSTEM_LLM_SECRET_NAME,
} from "@/lib/settings/extension-secrets";

type RawSystemLlmConfig = {
  provider?: unknown;
  model?: unknown;
  chatModel?: unknown;
  embeddingModel?: unknown;
  meetingRefineModel?: unknown;
  sttModel?: unknown;
  fallbackModels?: unknown;
};

export type ResolvedAiConfig = {
  provider: "openrouter";
  chatModel: string;
  embeddingModel: string;
  meetingRefineModel: string;
  sttModel: string;
  fallbackModels: string[];
  isActive: boolean;
};

export async function getOpenRouterRuntimeConfig(options?: {
  apiKeyOverride?: string | null;
}) {
  const overrideKey = options?.apiKeyOverride?.trim();
  const storedApiKey = overrideKey
    ? overrideKey
    : await getDecryptedExtensionSecret("system_llm", SYSTEM_LLM_SECRET_NAME);
  const apiKey =
    storedApiKey ?? process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API 키가 설정되지 않았습니다. 시스템 설정에서 API 키를 저장하거나 서버 환경변수를 설정해 주세요.",
    );
  }

  const siteUrl =
    process.env.OPENROUTER_SITE_URL ?? getAppBaseUrl({ fallback: undefined });
  const appName = process.env.OPENROUTER_APP_NAME ?? "WorkPresso";

  return {
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    headers: {
      ...(siteUrl ? { "HTTP-Referer": siteUrl } : {}),
      ...(appName ? { "X-Title": appName } : {}),
    },
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function getResolvedAiConfig(): Promise<ResolvedAiConfig> {
  let rawConfig: RawSystemLlmConfig = {};
  let isActive = false;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("workspace_extensions")
      .select("config, is_active")
      .eq("ext_name", "system_llm")
      .maybeSingle();

    if (error) {
      throw error;
    }

    rawConfig = (data?.config as RawSystemLlmConfig | null) ?? {};
    isActive = data?.is_active ?? false;
  } catch (error) {
    console.warn("system_llm config load skipped:", error);
  }

  const legacyModelHint =
    asString(rawConfig.model) ?? asString(rawConfig.provider);

  return {
    provider: "openrouter",
    chatModel: normalizeModelId(
      asString(rawConfig.chatModel) ?? legacyModelHint,
      "chat",
    ),
    embeddingModel: normalizeModelId(
      asString(rawConfig.embeddingModel) ??
        process.env.OPENROUTER_EMBEDDING_MODEL ??
        getDefaultModel("embedding"),
      "embedding",
    ),
    meetingRefineModel: normalizeModelId(
      asString(rawConfig.meetingRefineModel) ?? legacyModelHint,
      "meetingRefine",
    ),
    sttModel: normalizeModelId(
      asString(rawConfig.sttModel) ??
        process.env.OPENROUTER_STT_MODEL ??
        "gpt-4o-audio-preview",
      "stt",
    ),
    fallbackModels: asStringArray(rawConfig.fallbackModels).map((model) =>
      normalizeModelId(model, "chat"),
    ),
    isActive,
  };
}
