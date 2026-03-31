import { NextResponse } from "next/server";

import { actOnWorkflowDocument } from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";

type SlackActionValue = {
  documentId: string;
  approverId: string;
  action: "APPROVE" | "REJECT";
};

function slackMessage(text: string) {
  return NextResponse.json({
    response_type: "ephemeral",
    replace_original: false,
    text,
  });
}

async function parseSlackPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const payload = formData.get("payload");

    if (typeof payload !== "string") {
      return null;
    }

    try {
      return JSON.parse(payload) as {
        type?: string;
        actions?: Array<{ action_id?: string; value?: string }>;
      };
    } catch {
      return null;
    }
  }

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => null)) as {
      type?: string;
      actions?: Array<{ action_id?: string; value?: string }>;
    } | null;
  }

  return null;
}

export async function POST(request: Request) {
  const payload = await parseSlackPayload(request);

  if (!payload || payload.type !== "block_actions") {
    return slackMessage("지원하지 않는 Slack 인터랙션 요청입니다.");
  }

  const action = payload.actions?.[0];

  if (!action?.value) {
    return slackMessage("Slack 액션 값을 찾지 못했습니다.");
  }

  let actionValue: SlackActionValue;

  try {
    actionValue = JSON.parse(action.value) as SlackActionValue;
  } catch {
    return slackMessage("Slack 액션 정보를 해석하지 못했습니다.");
  }

  if (
    !actionValue.documentId ||
    !actionValue.approverId ||
    !["APPROVE", "REJECT"].includes(actionValue.action)
  ) {
    return slackMessage("유효하지 않은 Slack 승인 요청입니다.");
  }

  const adminSupabase = createAdminClient();

  try {
    const document = await actOnWorkflowDocument({
      adminSupabase,
      viewerId: actionValue.approverId,
      documentId: actionValue.documentId,
      action: actionValue.action,
    });

    if (!document) {
      return slackMessage("처리할 문서를 찾지 못했습니다.");
    }

    const resultText =
      actionValue.action === "APPROVE"
        ? document.status === "APPROVED"
          ? `문서 "${document.title}"를 최종 승인하셨습니다.`
          : `문서 "${document.title}"를 승인하셨고 다음 결재 단계로 넘겼습니다.`
        : `문서 "${document.title}"를 반려하셨습니다.`;

    return slackMessage(resultText);
  } catch (error) {
    return slackMessage(
      error instanceof Error
        ? `승인 처리 실패: ${error.message}`
        : "승인 처리를 완료하지 못했습니다.",
    );
  }
}
