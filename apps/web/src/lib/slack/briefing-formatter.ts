/**
 * [Part 5 - Slack Block Kit Formatter]
 * 
 * 오늘의 일정 및 Jira 이슈 데이터를 받아 Slack Block Kit 형식의
 * 모닝 브리핑 메시지 페이로드를 생성하는 포매터입니다.
 * 
 * - 실제 전송은 SLACK_WEBHOOK_URL 환경변수를 사용합니다.
 * - 더미 모드일 경우 실제 전송 없이 콘솔 및 API 응답으로 페이로드를 확인합니다.
 * @see https://api.slack.com/block-kit
 */

import type { JiraIssue } from "@/lib/dummy-data/jira";

type Schedule = {
  title: string;
  start_time: string;
  end_time: string;
  type?: string;
};

const PRIORITY_EMOJI: Record<JiraIssue["priority"], string> = {
  Highest: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🔵",
};

const TYPE_EMOJI: Record<string, string> = {
  MEETING: "🤝",
  VACATION: "🏖️",
  HALF_DAY: "🌓",
  WFH: "🏠",
  OUTSIDE: "🚗",
  TASK: "📋",
};

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  });
}

export function buildBriefingPayload(
  schedules: Schedule[],
  jiraIssues: JiraIssue[],
  isDummy = true
) {
  const dateString = formatDate();

  // --- 일정 블록 구성 ---
  const scheduleLines =
    schedules.length > 0
      ? schedules
          .map(
            (s) =>
              `• ${TYPE_EMOJI[s.type || "TASK"] ?? "📋"} *${s.title}* (${formatTime(s.start_time)} ~ ${formatTime(s.end_time)})`
          )
          .join("\n")
      : "_오늘 등록된 일정이 없습니다._";

  // --- Jira 이슈 블록 구성 ---
  const jiraLines =
    jiraIssues.length > 0
      ? jiraIssues
          .map(
            (issue) =>
              `• ${PRIORITY_EMOJI[issue.priority]} \`${issue.key}\` ${issue.summary} — _${issue.status}_`
          )
          .join("\n")
      : "_오늘 마감인 Jira 태스크가 없습니다._";

  // --- Slack Block Kit 페이로드 ---
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `☀️  오늘의 WorkPresso 모닝 브리핑`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*${dateString}* | 좋은 아침이에요! 오늘 하루도 힘차게 시작하세요 💪`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📅  오늘의 일정*\n${scheduleLines}`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🎯  오늘 마감 Jira 태스크*\n${jiraLines}`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📆 캘린더 열기", emoji: true },
          url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/schedules`,
          action_id: "open_calendar",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "👥 팀 상태 보기", emoji: true },
          url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/teammates`,
          action_id: "open_teammates",
        },
      ],
    },
  ];

  if (isDummy) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "⚙️ _이 메시지는 더미(Mock) 모드로 생성되었습니다. 실제 Jira/Slack 연동 전 UI 확인용입니다._",
        },
      ],
    } as any);
  }

  return { blocks };
}

/**
 * Slack Webhook URL로 브리핑 메시지를 실제 전송합니다.
 * SLACK_WEBHOOK_URL 환경변수가 없으면 콘솔 출력으로 대체합니다.
 */
export async function sendSlackBriefing(payload: { blocks: any[] }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    // 더미 모드: 실제 전송 없이 콘솔에 출력
    console.log(
      "[Slack Briefing - DUMMY MODE] 전송 페이로드:",
      JSON.stringify(payload, null, 2)
    );
    return { ok: true, mode: "dummy", message: "콘솔에 출력되었습니다." };
  }

  // 실제 Slack Webhook 전송
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack 전송 실패: ${res.status} ${await res.text()}`);
  }

  return { ok: true, mode: "live" };
}
