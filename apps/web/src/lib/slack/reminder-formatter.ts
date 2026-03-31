/**
 * [Part 5 - Slack Block Kit: Meeting Reminder Formatter]
 *
 * 회의 시작 10분 전 Slack으로 전송할 맥락(Context) 리마인더 메시지를 생성합니다.
 *
 * 포함 내용:
 *  - 회의 제목 및 시작 시간
 *  - 관련 문서 바로가기 링크 (Pod A - Canvas)
 *  - 직전 회의록 바로가기 링크 (Pod D - Voice)
 *  - RSVP 인터랙티브 버튼 ([참석] / [불참] / [늦을 예정])
 *
 * [주의] RSVP 버튼 실제 처리(interactivity)는 Slack App의 Interactivity URL 설정이 필요합니다.
 *        더미 모드에서는 버튼 UI만 구성하며, 실제 클릭 처리는 /api/slack/actions 에서 담당합니다.
 * @see https://api.slack.com/block-kit
 */

import { getAppBaseUrl } from "@/lib/app-url";

type ReminderContext = {
  meetingTitle: string;
  startTime: Date;
  /** Pod A 관련 문서 URL (없으면 undefined) */
  documentUrl?: string;
  /** Pod D 직전 회의록 URL (없으면 undefined) */
  meetingNoteUrl?: string;
  /** 더미 모드 여부 */
  isDummy?: boolean;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

export function buildReminderPayload({
  meetingTitle,
  startTime,
  documentUrl,
  meetingNoteUrl,
  isDummy = true,
}: ReminderContext) {
  const baseUrl = getAppBaseUrl();

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔔 회의 시작 10분 전입니다!`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${meetingTitle}*\n⏰ 시작 시간: *${formatTime(startTime)}*\n\n지금 바로 참석 여부를 알려주세요.`,
      },
    },
    { type: "divider" },
    // RSVP 버튼 (양방향 인터랙션 - 더미 모드에서도 UI 구성은 동일)
    {
      type: "actions",
      block_id: "rsvp_actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "✅ 참석", emoji: true },
          style: "primary",
          action_id: "rsvp_attend",
          value: JSON.stringify({ meetingTitle, status: "attend" }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "❌ 불참", emoji: true },
          style: "danger",
          action_id: "rsvp_absent",
          value: JSON.stringify({ meetingTitle, status: "absent" }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "⏱️ 늦을 예정", emoji: true },
          action_id: "rsvp_late",
          value: JSON.stringify({ meetingTitle, status: "late" }),
        },
      ],
    },
    { type: "divider" },
  ];

  // 관련 문서 링크 (Pod A)
  if (documentUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📄 관련 문서 (Canvas)*\n<${documentUrl}|회의 자료 바로가기>`,
      },
    });
  }

  // 직전 회의록 링크 (Pod D)
  if (meetingNoteUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🎙️ 직전 회의록 (Voice)*\n<${meetingNoteUrl}|직전 회의록 보기>`,
      },
    });
  }

  // 문서/회의록이 없는 경우 안내
  if (!documentUrl && !meetingNoteUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_관련 문서나 직전 회의록이 연결되어 있지 않습니다._\n<${baseUrl}/documents|Canvas에서 문서 등록하기>`,
      },
    });
  }

  if (isDummy) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `⚙️ _더미(Mock) 모드입니다. RSVP 버튼 클릭은 실제 Slack App Interactivity 설정 후 동작합니다._`,
        },
      ],
    });
  }

  return { blocks };
}

/**
 * Slack Webhook 또는 콘솔(더미 모드)로 리마인더를 전송합니다.
 */
export async function sendReminderMessage(payload: { blocks: any[] }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(
      "[Meeting Reminder - DUMMY MODE] 전송 페이로드:",
      JSON.stringify(payload, null, 2)
    );
    return { ok: true, mode: "dummy" };
  }

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
