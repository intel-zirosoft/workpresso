import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

import { getOpenRouterRuntimeConfig } from "@/lib/ai/config";

export async function createOpenRouterProvider(options?: {
  apiKeyOverride?: string | null;
}) {
  const runtimeConfig = await getOpenRouterRuntimeConfig(options);

  return createOpenAI({
    apiKey: runtimeConfig.apiKey,
    baseURL: runtimeConfig.baseURL,
    headers: runtimeConfig.headers,
    name: "openrouter",
    compatibility: "compatible",
  });
}

export async function createOpenRouterClient(options?: {
  apiKeyOverride?: string | null;
}) {
  const runtimeConfig = await getOpenRouterRuntimeConfig(options);

  return new OpenAI({
    apiKey: runtimeConfig.apiKey,
    baseURL: runtimeConfig.baseURL,
    defaultHeaders: runtimeConfig.headers,
  });
}
