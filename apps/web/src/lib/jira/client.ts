/**
 * [Part 5 - Jira REST API Client]
 *
 * 실제 Jira Cloud REST API v3를 사용하여 이슈를 조회합니다.
 * 환경변수가 없으면 더미 데이터로 자동 폴백합니다.
 *
 * 필요한 환경변수:
 *  - JIRA_BASE_URL      예: https://workpresso.atlassian.net
 *  - JIRA_USER_EMAIL    예: polly.saids@gmail.com
 *  - JIRA_API_TOKEN     Jira에서 발급받은 Personal Access Token
 *  - JIRA_PROJECT_KEY   예: KAN
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/
 */

import { getDummyJiraIssues, type JiraIssue } from "@/lib/dummy-data/jira";
import { createClient } from "@/lib/supabase/server";

interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

/**
 * 우선순위: 1. DB (workspace_extensions), 2. Env (.env.local)
 */
async function getActiveJiraConfig(): Promise<JiraConfig | null> {
  // 1. DB에서 활성화된 설정 조회
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('workspace_extensions')
      .select('config, is_active')
      .eq('ext_name', 'jira')
      .single();

    if (data && data.is_active && data.config) {
      const cfg = data.config as any;
      if (cfg.domain && cfg.email && cfg.apiToken && cfg.projectKey) {
        return {
          domain: cfg.domain,
          email: cfg.email,
          apiToken: cfg.apiToken,
          projectKey: cfg.projectKey
        };
      }
    }
  } catch (e) {
    console.error("[Jira Client] DB 설정 로드 실패:", e);
  }

  // 2. 환경변수에서 조회 (Fallback)
  if (
    process.env.JIRA_BASE_URL &&
    process.env.JIRA_USER_EMAIL &&
    process.env.JIRA_API_TOKEN &&
    process.env.JIRA_PROJECT_KEY
  ) {
    return {
      domain: process.env.JIRA_BASE_URL.replace('https://', ''),
      email: process.env.JIRA_USER_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
      projectKey: process.env.JIRA_PROJECT_KEY
    };
  }

  return null;
}

function getJiraAuthHeader(email: string, token: string): string {
  return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

/**
 * Jira의 우선순위 이름을 내부 타입으로 변환합니다.
 */
function mapPriority(jiraPriority: string): JiraIssue["priority"] {
  const map: Record<string, JiraIssue["priority"]> = {
    Highest: "Highest",
    High: "High",
    Medium: "Medium",
    Low: "Low",
    Lowest: "Low",
  };
  return map[jiraPriority] ?? "Medium";
}

/**
 * 오늘 마감이거나 마감이 지난 나에게 할당된 Jira 이슈를 조회합니다.
 * 환경변수가 세팅되지 않은 경우 더미 데이터를 반환합니다.
 */
export async function getJiraIssuesDueToday(): Promise<{
  issues: JiraIssue[];
  isDummy: boolean;
  error?: string;
}> {
  const config = await getActiveJiraConfig();
  
  if (!config) {
    console.log("[Jira Client] 설정이 없어 더미 데이터를 사용합니다.");
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const { domain, email, apiToken, projectKey } = config;
  const baseUrl = `https://${domain}`;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // [개선] currentUser()를 사용하여 토큰 소유자의 태스크를 동적으로 조회합니다.
  const jql = encodeURIComponent(
    `project = ${projectKey} AND assignee = currentUser() AND duedate <= "${today}" AND statusCategory != Done ORDER BY priority ASC`
  );

  const url = `${baseUrl}/rest/api/3/search/jql`;
  const jqlBody = {
    jql: `project = ${projectKey} AND assignee = currentUser() AND duedate <= "${today}" AND statusCategory != Done ORDER BY priority ASC`,
    maxResults: 10,
    fields: ["summary", "status", "priority", "duedate", "assignee"],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: getJiraAuthHeader(email, apiToken),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(jqlBody),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = `Jira API 오류 (${res.status}): ${JSON.stringify(errorData)}`;
      console.error(`[Jira Client] ${errorMsg}`);
      return { issues: getDummyJiraIssues(), isDummy: true, error: errorMsg };
    }

    const data = await res.json();

    const issues: JiraIssue[] = (data.issues ?? []).map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.statusCategory?.name ?? "To Do",
      priority: mapPriority(issue.fields.priority?.name ?? "Medium"),
      dueDate: issue.fields.duedate ?? today,
      assignee: issue.fields.assignee?.displayName ?? "나",
    }));

    return { issues, isDummy: false };
  } catch (err: any) {
    const errorMsg = `네트워크 오류: ${err.message}`;
    console.error("[Jira Client]", errorMsg);
    return { issues: getDummyJiraIssues(), isDummy: true, error: errorMsg };
  }
}

/**
 * 특정 프로젝트의 모든 미완료 이슈를 조회합니다. (focus-time용)
 */
export async function getHighPriorityJiraIssues(): Promise<{
  issues: JiraIssue[];
  isDummy: boolean;
}> {
  const config = await getActiveJiraConfig();

  if (!config) {
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const { domain, email, apiToken, projectKey } = config;
  const baseUrl = `https://${domain}`;

  // [변경] 최신 Jira API 규격에 맞춰 POST /rest/api/3/search/jql 사용
  const url = `${baseUrl}/rest/api/3/search/jql`;
  const jqlBody = {
    jql: `project = ${projectKey} AND assignee = currentUser() AND priority in (Highest, High) AND statusCategory != Done ORDER BY priority ASC`,
    maxResults: 5,
    fields: ["summary", "status", "priority", "duedate", "assignee"],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: getJiraAuthHeader(email, apiToken),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(jqlBody),
      cache: "no-store",
    });

    if (!res.ok) {
      return { issues: getDummyJiraIssues(), isDummy: true };
    }

    const data = await res.json();
    const today = new Date().toISOString().split("T")[0];

    const issues: JiraIssue[] = (data.issues ?? []).map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.statusCategory?.name ?? "To Do",
      priority: mapPriority(issue.fields.priority?.name ?? "High"),
      dueDate: issue.fields.duedate ?? today,
      assignee: issue.fields.assignee?.displayName ?? "나",
    }));

    return { issues, isDummy: false };
  } catch (err) {
    console.error("[Jira Client] 네트워크 오류:", err);
    return { issues: getDummyJiraIssues(), isDummy: true };
  }
}
