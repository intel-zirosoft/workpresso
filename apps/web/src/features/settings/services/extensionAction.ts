"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmbedding } from '@/lib/ai/embeddings';
import { generateJsonObject } from '@/lib/ai/chat';
import { getOpenRouterRuntimeConfig } from '@/lib/ai/config';
import {
  getExtensionSecretSummary,
  SYSTEM_LLM_SECRET_NAME,
  upsertExtensionSecret,
} from '@/lib/settings/extension-secrets';
import { getUserProfile } from './userAction';

export async function getExtension(extName: string) {
  // Determine role based auth
  const profile = await getUserProfile();

  if (extName === "system_llm" && profile.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Need SUPER_ADMIN for system_llm");
  }

  if (
    (extName === "slack" || extName === "jira") &&
    profile.role !== "SUPER_ADMIN" &&
    profile.role !== "ORG_ADMIN"
  ) {
    throw new Error("Forbidden: Need at least ORG_ADMIN for " + extName);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_extensions")
    .select("*")
    .eq("ext_name", extName)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is no rows
    throw new Error(error.message);
  }
  return data;
}

export async function upsertExtension(
  extName: string,
  config: Record<string, any>,
  isActive: boolean,
) {
  const profile = await getUserProfile();

  if (extName === "system_llm" && profile.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Need SUPER_ADMIN for system_llm");
  }

  if (
    (extName === "slack" || extName === "jira") &&
    profile.role !== "SUPER_ADMIN" &&
    profile.role !== "ORG_ADMIN"
  ) {
    throw new Error("Forbidden: Need at least ORG_ADMIN for " + extName);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("workspace_extensions")
    .upsert(
      {
        ext_name: extName,
        config,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ext_name" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSystemLlmSecretSummary() {
  const profile = await getUserProfile();

  if (profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }

  return getExtensionSecretSummary({
    extName: 'system_llm',
    secretName: SYSTEM_LLM_SECRET_NAME,
    fallbackValue: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? null,
  });
}

export async function upsertSystemLlmApiKey(apiKey: string) {
  const profile = await getUserProfile();

  if (profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }

  await upsertExtensionSecret({
    extName: 'system_llm',
    secretName: SYSTEM_LLM_SECRET_NAME,
    plainValue: apiKey,
    updatedBy: profile.id,
  });

  return { success: true };
}

/**
 * Jira 연동 테스트: domain, email, apiToken 유효성 확인
 */
export async function testJiraConnection(config: {
  domain: string;
  email: string;
  apiToken: string;
}) {
  const { domain, email, apiToken } = config;

  if (!domain || !email || !apiToken) {
    throw new Error(
      "Jira 연동을 위한 모든 정보(Domain, Email, API Token)를 입력해주세요.",
    );
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Atlassian REST API를 호출하여 자격 증명 확인
    const response = await fetch(`https://${domain}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Jira 연결 실패: ${response.status} ${errorData.errorMessages ? errorData.errorMessages[0] : "Unauthorized"}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      message: `Jira 연결 성공! 안녕하세요, ${data.displayName}님.`,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Jira 연결 시도 중 네트워크 오류가 발생했습니다.",
    );
  }
}

/**
 * Slack 연동 테스트: Webhook URL 유효성 확인
 */
export async function testSlackConnection(webhookUrl: string) {
  if (!webhookUrl) {
    throw new Error("Slack Webhook URL을 입력해주세요.");
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "🚀 *WorkPresso 사령탑*: Slack 연동 테스트에 성공했습니다!",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack 연결 실패: ${response.status} ${errorText}`);
    }

    return {
      success: true,
      message: "Slack으로 테스트 메시지를 발송했습니다.",
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Slack 연결 시도 중 네트워크 오류가 발생했습니다.",
    );
  }
}

/**
 * 시스템 AI(LLM) 연동 테스트: OpenRouter 및 모델 유효성 확인
 */
export async function testLLMConnection(config: {
  apiKey?: string;
  chatModel?: string;
  embeddingModel?: string;
  meetingRefineModel?: string;
  sttModel?: string;
}) {
  const runtimeConfig = await getOpenRouterRuntimeConfig({
    apiKeyOverride: config.apiKey,
  });

  if (!runtimeConfig.apiKey) {
    throw new Error('OpenRouter API 키가 설정되지 않았습니다.');
  }

  const chatModel = config.chatModel || 'openai/gpt-4o-mini';
  const embeddingModel = config.embeddingModel || 'openai/text-embedding-3-small';
  const meetingRefineModel = config.meetingRefineModel || chatModel;

  await createEmbedding('OpenRouter connection test', {
    model: embeddingModel,
    apiKeyOverride: config.apiKey,
  });

  await generateJsonObject({
    model: meetingRefineModel,
    prompt: '다음 JSON만 반환하세요: {"ok":true}',
    apiKeyOverride: config.apiKey,
  });

  return { 
    success: true, 
    message: `OpenRouter 연결 성공! chat=${chatModel}, embedding=${embeddingModel}` 
  };
}

/**
 * Jira 이슈 생성: summary, description, projectKey 기반
 */
export async function createJiraIssue(issue: {
  summary: string;
  description: string;
  projectKey?: string;
  issueType?: string; // Task, Bug, Story 등
}) {
  const jira = await getExtension("jira");
  if (!jira || !jira.is_active) {
    throw new Error(
      "Jira 연동이 활성화되어 있지 않습니다. 설정에서 연동을 먼저 완료해주세요.",
    );
  }

  const {
    domain,
    email,
    apiToken,
    projectKey: defaultProjectKey,
  } = jira.config as any;
  const projectKey = issue.projectKey || defaultProjectKey;

  if (!domain || !email || !apiToken || !projectKey) {
    throw new Error(
      "Jira 연동 정보(Domain, Email, Token, Project Key)가 누락되었습니다.",
    );
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Atlassian Document Format (ADF)로 설명(Description) 구성
    const bodyData = {
      fields: {
        project: { key: projectKey },
        summary: issue.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: issue.description,
                },
              ],
            },
          ],
        },
        issuetype: { name: issue.issueType || "Task" },
      },
    };

    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Jira 이슈 생성 실패: ${response.status} ${errorData.errors ? JSON.stringify(errorData.errors) : "Unauthorized"}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      issueKey: data.key,
      issueUrl: `https://${domain}/browse/${data.key}`,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Jira 이슈 생성 중 네트워크 오류가 발생했습니다.",
    );
  }
}

/**
 * 범용 Slack 메시지 발송: 타 파드에서 실제 알림/브리핑 시 사용
 */
export async function sendSlackMessage(text: string, blocks?: any[]) {
  const slack = await getExtension("slack");
  if (!slack || !slack.is_active) {
    throw new Error("Slack 연동이 활성화되어 있지 않습니다.");
  }

  const { webhookUrl } = slack.config as any;
  if (!webhookUrl) throw new Error("Slack Webhook URL이 설정되지 않았습니다.");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack 메시지 발송 실패: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[sendSlackMessage] Error:", error);
    throw new Error("Slack 메시지 전송 중 오류가 발생했습니다.");
  }
}

/**
 * 전사 연동 시스템 진단: 현재 설정된 모든 도구의 상태를 한 번에 조회
 */
export async function getIntegrationsStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_extensions")
    .select("ext_name, is_active, updated_at");

  if (error) throw new Error(error.message);

  return {
    slack: data?.find((d) => d.ext_name === "slack") || { is_active: false },
    jira: data?.find((d) => d.ext_name === "jira") || { is_active: false },
    llm: data?.find((d) => d.ext_name === "system_llm") || { is_active: false },
  };
}
