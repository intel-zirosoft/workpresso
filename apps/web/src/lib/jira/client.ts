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

function getJiraAuthHeader(): string {
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;
  return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

function isJiraConfigured(): boolean {
  return !!(
    process.env.JIRA_BASE_URL &&
    process.env.JIRA_USER_EMAIL &&
    process.env.JIRA_API_TOKEN &&
    process.env.JIRA_PROJECT_KEY
  );
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
}> {
  if (!isJiraConfigured()) {
    console.log("[Jira Client] 환경변수가 없어 더미 데이터를 사용합니다.");
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_USER_EMAIL!;
  const projectKey = process.env.JIRA_PROJECT_KEY;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // JQL: assignee = currentUser() 는 서버사이드 토큰에서 동작하지 않으므로 이메일 직접 지정
  const jql = encodeURIComponent(
    `project = ${projectKey} AND assignee = "${email}" AND duedate <= "${today}" AND statusCategory != Done ORDER BY priority ASC`
  );

  const url = `${baseUrl}/rest/api/3/search?jql=${jql}&fields=summary,status,priority,duedate&maxResults=10`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: getJiraAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Next.js 캐싱 비활성화 (실시간 데이터)
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Jira Client] API 오류 (${res.status}):`, errorText);
      // API 실패 시 더미 데이터로 폴백
      return { issues: getDummyJiraIssues(), isDummy: true };
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
  } catch (err) {
    console.error("[Jira Client] 네트워크 오류:", err);
    return { issues: getDummyJiraIssues(), isDummy: true };
  }
}

/**
 * 특정 프로젝트의 모든 미완료 이슈를 조회합니다. (focus-time용)
 */
export async function getHighPriorityJiraIssues(): Promise<{
  issues: JiraIssue[];
  isDummy: boolean;
}> {
  if (!isJiraConfigured()) {
    return { issues: getDummyJiraIssues(), isDummy: true };
  }

  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_USER_EMAIL!;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  const jql = encodeURIComponent(
    `project = ${projectKey} AND assignee = "${email}" AND priority in (Highest, High) AND statusCategory != Done ORDER BY priority ASC`
  );

  const url = `${baseUrl}/rest/api/3/search?jql=${jql}&fields=summary,status,priority,duedate&maxResults=5`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: getJiraAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
