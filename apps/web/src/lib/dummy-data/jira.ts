/**
 * [Part 5 - Dummy Data]
 * 실제 Jira API 연동 전, 개발 및 UI 검증을 위한 목(Mock) Jira 이슈 데이터입니다.
 * 실제 연동 시, 이 함수를 Jira REST API 호출로 교체합니다.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/
 */

export type JiraIssue = {
  id: string;
  key: string;
  summary: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Highest" | "High" | "Medium" | "Low";
  dueDate: string; // ISO 8601 date string
  assignee: string;
};

export function getDummyJiraIssues(): JiraIssue[] {
  const today = new Date().toISOString().split("T")[0];

  return [
    {
      id: "10001",
      key: "KAN-42",
      summary: "캘린더 뷰 가로 스크롤 버그 수정",
      status: "In Progress",
      priority: "High",
      dueDate: today,
      assignee: "나",
    },
    {
      id: "10002",
      key: "KAN-51",
      summary: "Slack 모닝 브리핑 API 엔드포인트 구현",
      status: "To Do",
      priority: "Highest",
      dueDate: today,
      assignee: "나",
    },
    {
      id: "10003",
      key: "KAN-38",
      summary: "팀원 상태 칸반 UI 코드 리뷰 반영",
      status: "To Do",
      priority: "Medium",
      dueDate: today,
      assignee: "나",
    },
  ];
}
