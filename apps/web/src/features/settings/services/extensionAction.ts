'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserProfile } from './userAction';

function getEnvExtensionFallback(extName: string) {
  if (extName === 'slack') {
    const webhookUrl = process.env.WORKPRESSO_SLACK_WEBHOOK_URL?.trim() ?? '';

    if (!webhookUrl) {
      return null;
    }

    return {
      ext_name: 'slack',
      is_active: true,
      config: { webhookUrl },
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

export async function getExtension(extName: string) {
  // Determine role based auth
  const profile = await getUserProfile();
  
  if (extName === 'system_llm' && profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }
  
  if ((extName === 'slack' || extName === 'jira') && profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Need at least ORG_ADMIN for ' + extName);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspace_extensions')
    .select('*')
    .eq('ext_name', extName)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
    throw new Error(error.message);
  }

  return mergeExtensionConfig(data, getEnvExtensionFallback(extName));
}

export async function upsertExtension(extName: string, config: Record<string, any>, isActive: boolean) {
  const profile = await getUserProfile();

  if (extName === 'system_llm' && profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }

  if ((extName === 'slack' || extName === 'jira') && profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Need at least ORG_ADMIN for ' + extName);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('workspace_extensions')
    .upsert({ 
      ext_name: extName, 
      config, 
      is_active: isActive,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'ext_name' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Jira 연동 테스트: domain, email, apiToken 유효성 확인
 */
export async function testJiraConnection(config: { domain: string, email: string, apiToken: string }) {
  const { domain, email, apiToken } = config;

  if (!domain || !email || !apiToken) {
    throw new Error('Jira 연동을 위한 모든 정보(Domain, Email, API Token)를 입력해주세요.');
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    // Atlassian REST API를 호출하여 자격 증명 확인
    const response = await fetch(`https://${domain}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Jira 연결 실패: ${response.status} ${errorData.errorMessages ? errorData.errorMessages[0] : 'Unauthorized'}`);
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Jira 연결 성공! 안녕하세요, ${data.displayName}님.` 
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Jira 연결 시도 중 네트워크 오류가 발생했습니다.');
  }
}

/**
 * Slack 연동 테스트: Webhook URL 유효성 확인
 */
export async function testSlackConnection(webhookUrl: string) {
  if (!webhookUrl) {
    throw new Error('Slack Webhook URL을 입력해주세요.');
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "🚀 *WorkPresso 사령탑*: Slack 연동 테스트에 성공했습니다!"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack 연결 실패: ${response.status} ${errorText}`);
    }

    return { 
      success: true, 
      message: 'Slack으로 테스트 메시지를 발송했습니다.' 
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Slack 연결 시도 중 네트워크 오류가 발생했습니다.');
  }
}

/**
 * 시스템 AI(LLM) 연동 테스트: API Key 및 Provider 유효성 확인
 */
export async function testLLMConnection(config: { provider: string, apiKey: string, model?: string }) {
  const { provider, apiKey } = config;

  if (!provider || !apiKey) {
    throw new Error('AI 연동을 위한 모든 정보(Provider, API Key)를 입력해주세요.');
  }

  // Google Gemini 연동 테스트
  if (provider.toLowerCase() === 'google') {
    try {
      // API 키 유효성 확인을 위한 간단한 모델 리스트 조회 호출
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google AI 연결 실패: ${response.status} ${errorData.error?.message || 'Unauthorized'}`);
      }

      const data = await response.json();
      const models = data.models || [];
      
      return { 
        success: true, 
        message: `Google AI 연결 성공! (${models.length}개의 모델 사용 가능)` 
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Google AI 연결 시도 중 네트워크 오류가 발생했습니다.');
    }
  }

  // OpenAI 등 타 프로바이더 확장 가능성 (현재는 Google 중심)
  if (provider.toLowerCase() === 'openai') {
    throw new Error('OpenAI 연동 테스트는 현재 준비 중입니다. Google(Gemini)을 권장합니다.');
  }

  throw new Error(`지원하지 않는 AI Provider입니다: ${provider}`);
}

/**
 * Jira 이슈 생성: summary, description, projectKey 기반
 */
export async function createJiraIssue(issue: {
  summary: string;
  description: string;
  projectKey?: string;
  issueTypeId?: string;
  parentKey?: string;
}) {
  const jira = await getIntegrationConfigForServer('jira');
  if (!jira || !jira.is_active) {
    throw new Error('Jira 연동이 활성화되어 있지 않습니다. 설정에서 연동을 먼저 완료해주세요.');
  }

  const { domain, email, apiToken, projectKey: defaultProjectKey } = jira.config as any;
  const projectKey = issue.projectKey || defaultProjectKey;

  if (!domain || !email || !apiToken || !projectKey) {
    throw new Error('Jira 연동 정보(Domain, Email, Token, Project Key)가 누락되었습니다.');
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    // Atlassian Document Format (ADF)로 설명(Description) 구성
    const bodyData = {
      fields: {
        project: { key: projectKey },
        summary: issue.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description
                }
              ]
            }
          ]
        },
        issuetype: issue.issueTypeId ? { id: issue.issueTypeId } : { name: 'Task' },
        ...(issue.parentKey ? { parent: { key: issue.parentKey } } : {}),
      },
    };

    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Jira 이슈 생성 실패: ${response.status} ${errorData.errors ? JSON.stringify(errorData.errors) : 'Unauthorized'}`);
    }

    const data = await response.json();
    return { 
      success: true, 
      issueKey: data.key, 
      issueUrl: `https://${domain}/browse/${data.key}` 
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Jira 이슈 생성 중 네트워크 오류가 발생했습니다.');
  }
}
