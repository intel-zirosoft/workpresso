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

/**
 * 지라 도메인을 정규화합니다.
 */
export async function sanitizeJiraDomain(domain: string): Promise<string> {
  if (!domain) return "";
  let cleanDomain = domain.trim();
  try {
    if (!cleanDomain.startsWith("http")) {
      cleanDomain = "https://" + cleanDomain;
    }
    const url = new URL(cleanDomain);
    return url.hostname;
  } catch (e) {
    return cleanDomain
      .replace(/^https?:\/\//, "")
      .split(/[/?#]/)[0]
      .replace(/\/+$/, "");
  }
}

function getEnvExtensionFallback(extName: string) {
  if (extName === 'slack') {
    const webhookUrl = process.env.WORKPRESSO_SLACK_WEBHOOK_URL?.trim() ?? '';
    const botToken = process.env.WORKPRESSO_SLACK_BOT_TOKEN?.trim() ?? '';

    if (!webhookUrl && !botToken) {
      return null;
    }

    return {
      ext_name: 'slack',
      is_active: Boolean(webhookUrl),
      config: { webhookUrl, botToken },
    };
  }

  if (extName === 'jira') {
    const domain = process.env.WORKPRESSO_JIRA_DOMAIN?.trim() ?? '';
    const email = process.env.WORKPRESSO_JIRA_EMAIL?.trim() ?? '';
    const projectKey = process.env.WORKPRESSO_JIRA_PROJECT_KEY?.trim() ?? '';
    const apiToken = process.env.WORKPRESSO_JIRA_API_TOKEN?.trim() ?? '';

    if (!domain && !email && !projectKey && !apiToken) {
      return null;
    }

    return {
      ext_name: 'jira',
      is_active: Boolean(domain && email && projectKey && apiToken),
      config: {
        domain,
        email,
        projectKey,
        apiToken,
      },
    };
  }

  return null;
}

function mergeExtensionConfig(
  data: any,
  fallback: ReturnType<typeof getEnvExtensionFallback>,
) {
  if (!data) {
    return fallback;
  }

  if (!fallback) {
    return data;
  }

  return {
    ...data,
    config: {
      ...(fallback.config ?? {}),
      ...((data.config as Record<string, unknown> | null) ?? {}),
    },
  };
}

async function getIntegrationConfigForServer(extName: string) {
  const envFallback = getEnvExtensionFallback(extName);

  if (envFallback?.is_active) {
    return envFallback;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('workspace_extensions')
    .select('*')
    .eq('ext_name', extName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mergeExtensionConfig(data, envFallback);
}

export type JiraIssueTypeSummary = {
  id: string;
  name: string;
  hierarchyLevel?: number;
  subtask?: boolean;
};

export async function getJiraProjectMetadata(projectKeyOverride?: string) {
  const jira = await getIntegrationConfigForServer('jira');

  if (!jira || !jira.is_active) {
    throw new Error('Jira 연동이 활성화되어 있지 않습니다. 설정에서 연동을 먼저 완료해주세요.');
  }

  const { domain, email, apiToken, projectKey: defaultProjectKey } = jira.config as any;
  const projectKey = projectKeyOverride || defaultProjectKey;

  if (!domain || !email || !apiToken || !projectKey) {
    throw new Error('Jira 연동 정보(Domain, Email, Token, Project Key)가 누락되었습니다.');
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const response = await fetch(`https://${domain}/rest/api/3/project/${projectKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Jira 프로젝트 조회 실패: ${response.status} ${errorData.errorMessages ? errorData.errorMessages[0] : 'Unauthorized'}`);
    }

    const data = await response.json();

    return {
      domain,
      email,
      apiToken,
      projectKey,
      projectName: data.name as string,
      issueTypes: ((data.issueTypes as any[] | undefined) ?? []).map((issueType) => ({
        id: issueType.id as string,
        name: issueType.name as string,
        hierarchyLevel: typeof issueType.hierarchyLevel === 'number' ? issueType.hierarchyLevel : undefined,
        subtask: Boolean(issueType.subtask),
      })) satisfies JiraIssueTypeSummary[],
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Jira 프로젝트 조회 중 네트워크 오류가 발생했습니다.');
  }
}

/**
 * 익스텐션 설정을 내부적으로 조회합니다. (역할 체크 없음)
 * 서버 액션 내부 또는 파드 간 공유용으로만 사용하며, 클라이언트에 민감한 정보를 노출하지 않도록 주의해야 합니다.
 */
export async function getExtensionInternal(extName: string) {
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

  return mergeExtensionConfig(data, getEnvExtensionFallback(extName));
}

/**
 * [Public Server Action] 익스텐션 설정을 조회합니다. (관리자 권한 필요)
 * 설정 페이지 등에서 연동 정보를 보여줄 때 사용합니다.
 */
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

  return getExtensionInternal(extName);
}

/**
 * 익스텐션이 활성화되어 있는지 여부만 안전하게 확인하여 반환합니다. (역할 체크 없음)
 */
export async function isExtensionActive(extName: string): Promise<boolean> {
  const ext = await getExtensionInternal(extName);
  return !!ext?.is_active;
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
    const sanitizedDomain = await sanitizeJiraDomain(domain);

    // Atlassian REST API를 호출하여 자격 증명 확인
    const response = await fetch(`https://${sanitizedDomain}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `Jira 연결 실패: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages[0]}`;
        }
      } catch (e) {
        // Fallback
      }
      throw new Error(errorMessage);
    }

    const userData = await response.json();

    // 진단: 접근 가능한 프로젝트 목록 가져오기
    const projectsResponse = await fetch(`https://${sanitizedDomain}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    let projects: Array<{ name: string; key: string; issueTypes?: string[] }> = [];
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      projects = projectsData.map((p: any) => ({
        name: p.name,
        key: p.key,
        issueTypes: p.issueTypes?.map((it: any) => it.name) || []
      }));
    }

    return {
      success: true,
      message: `Jira 연결 성공! 안녕하세요, ${userData.displayName}님.`,
      projects,
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
 * 진단 도구: 현재 계정으로 접근 가능한 모든 지라 프로젝트 목록 출력
 */
export async function listAccessibleJiraProjects() {
  const jira = await getExtensionInternal("jira");
  if (!jira || !jira.config) throw new Error("Jira 설정이 없습니다.");

  const { domain, email, apiToken } = jira.config as any;
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const sanitizedDomain = await sanitizeJiraDomain(domain);

  try {
    const response = await fetch(`https://${sanitizedDomain}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`프로젝트 목록 조회 실패: ${response.status}`);

    const projects = await response.json();
    console.log("--- Accessible Jira Projects ---");
    projects.forEach((p: any) => {
      console.log(`- Name: ${p.name}, Key: [${p.key}], ID: ${p.id}`);
    });
    console.log("-------------------------------");
    
    return projects.map((p: any) => ({ name: p.name, key: p.key }));
  } catch (error) {
    console.error("[listAccessibleJiraProjects] Error:", error);
    throw error;
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
 * Jira 실행 시점 설정을 DB와 환경 변수에서 순차적으로 조회하여 반환합니다.
 */
export async function getJiraRuntimeConfig() {
  const jira = await getExtensionInternal("jira");
  const config = (jira?.config as any) || {};

  const rawDomain = config.domain || process.env.JIRA_BASE_URL;
  const email = config.email || process.env.JIRA_USER_EMAIL;
  const token = config.apiToken || process.env.JIRA_API_TOKEN;

  if (!rawDomain || !email || !token) {
    return { isConfigured: false, config: null };
  }

  const sanitizedDomain = await sanitizeJiraDomain(rawDomain);
  const baseUrl = `https://${sanitizedDomain}`;
  
  // DB에 설정이 명시적으로 존재한다면(공백이라도), 환경변수보다 우선함
  const projectKey = (config.projectKey !== undefined && config.projectKey !== null) 
    ? config.projectKey 
    : (process.env.JIRA_PROJECT_KEY || "");

  const authHeader = "Basic " + Buffer.from(`${email}:${token}`).toString("base64");

  return {
    isConfigured: true,
    config: {
      baseUrl,
      email,
      token,
      projectKey,
      authHeader,
    }
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
  issueTypeId?: string;
  parentKey?: string;
}) {
  const jira = await getIntegrationConfigForServer('jira');
  if (!jira || !jira.is_active) {
    throw new Error(
      "Jira 연동이 활성화되어 있지 않습니다. 설정에서 연동을 먼저 완료해주세요.",
    );
  }

  // 1. 설정 가져오기 (DB 설정 우선, 환경 변수 폴백)
  // DB 설정 (SSOT 원칙)
  let domain = (jira.config as any)?.domain?.trim();
  let email = (jira.config as any)?.email?.trim();
  let apiToken = (jira.config as any)?.apiToken?.trim();
  const dbProjectKey = (jira.config as any)?.projectKey;

  // DB에 값이 없거나 undefined일 때만 환경 변수 참조 (Aggressive Fallback 방지)
  domain = domain || process.env.JIRA_BASE_URL;
  email = email || process.env.JIRA_USER_EMAIL;
  apiToken = apiToken || process.env.JIRA_API_TOKEN;
  
  const projectKey = issue.projectKey || (dbProjectKey ? dbProjectKey.trim() : process.env.JIRA_PROJECT_KEY);

  if (!domain || !email || !apiToken || !projectKey) {
    throw new Error(
      "Jira 연동 정보(Domain, Email, Token, Project Key)가 누락되었습니다. 설정에서 연동을 완료하거나 서버 환경 변수를 확인해주세요.",
    );
  }

  // 도메인 형식 정규화
  const sanitizedDomain = await sanitizeJiraDomain(domain);
  const sanitizedProjectKey = projectKey.trim().toUpperCase();

  console.log(`[Jira-Debug] Attempting issue creation of ${sanitizedDomain} in Project [${sanitizedProjectKey}] for user ${email.substring(0, 3)}***`);

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Atlassian Document Format (ADF)로 설명(Description) 구성
    const bodyData = {
      fields: {
        project: { key: sanitizedProjectKey },
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
        issuetype: issue.issueTypeId
          ? { id: issue.issueTypeId }
          : { name: issue.issueType || "Task" },
        ...(issue.parentKey ? { parent: { key: issue.parentKey } } : {}),
      },
    };

    const response = await fetch(`https://${sanitizedDomain}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      let errorMessage = `Jira 이슈 생성 실패: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages[0]}`;
        } else if (errorData.errors && Object.keys(errorData.errors).length > 0) {
          errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
        } else {
          errorMessage += " - Unauthorized or Permission Denied";
        }
      } catch (e) {
        // JSON parsing failed
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      issueKey: data.key,
      issueUrl: `https://${sanitizedDomain}/browse/${data.key}`,
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
 * 전사 공용 Slack 알림 전송: 텍스트 또는 Block Kit 객체를 지원합니다.
 */
export async function sendSlackMessage(message: string, blocks?: any[]) {
  const slack = await getExtensionInternal("slack");
  const webhookUrl = (slack?.config as any)?.webhookUrl;

  if (!webhookUrl || !slack?.is_active) {
    return { success: false, message: "Slack 연동이 비활성화되어 있거나 설정이 없습니다." };
  }

  try {
    const payload = blocks ? { text: message, blocks } : { text: message };
    
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, message: `Slack API 오류: ${res.status}` };
    }

    return { success: true, message: "Slack 메시지 전송 성공" };
  } catch (error: any) {
    console.error("[sendSlackMessage] Error:", error);
    return { success: false, message: error.message };
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
    // 자동화 엔진 상태 (Pod-B 파트 확장 포인트)
    automation: {
      dailyBriefing: true, // 기본 탑재
      jiraSync: data?.find((d) => d.ext_name === "jira")?.is_active || false,
    }
  };
}
