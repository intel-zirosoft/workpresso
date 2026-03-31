/**
 * [Part 5 - Jira REST API Client]
 *
 * 실제 Jira Cloud REST API v3를 사용하여 이슈를 조회합니다.
 * 중앙 집중식 연동 엔진(extensionAction)을 통해 DB 설정을 우선 조회하며,
 * 설정이 없는 경우 환경 변수 및 더미 데이터로 폴백합니다.
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/
 */

import { getDummyJiraIssues, type JiraIssue } from "@/lib/dummy-data/jira";
import { getJiraRuntimeConfig } from "@/features/settings/services/extensionAction";

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
 * DB 설정이 된 경우 실제 데이터를, 그렇지 않으면 더미 데이터를 반환합니다.
 */
export async function getJiraIssuesDueToday(): Promise<{
  issues: JiraIssue[];
  isDummy: boolean;
  error?: string;
}> {
  const { isConfigured, config } = await getJiraRuntimeConfig();

  if (!isConfigured || !config) {
    console.log("[Jira Client] 설정이 구성되지 않아 더미 데이터를 사용합니다.");
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const { baseUrl, projectKey, authHeader } = config;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 최신 Jira API 규격에 맞춰 POST /rest/api/3/search/jql 사용
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
        Authorization: authHeader,
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
  const { isConfigured, config } = await getJiraRuntimeConfig();

  if (!isConfigured || !config) {
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const { baseUrl, projectKey, authHeader } = config;

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
        Authorization: authHeader,
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
