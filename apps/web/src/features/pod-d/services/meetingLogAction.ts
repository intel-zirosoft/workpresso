"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildMeetingLogKnowledgeContent,
} from "@/features/pod-c/services/knowledge-sync";
import { generateJsonObject } from "@/lib/ai/chat";
import { getResolvedAiConfig } from "@/lib/ai/config";
import { revalidatePath } from "next/cache";

/**
 * DB에서 시스템 설정을 가져와 실제 AI 리파인먼트를 수행합니다. (보안 강화 및 멀티 엔진 지원)
 */
export async function refineMeetingLogServer(id: string, sttText: string) {
  const supabase = await createClient();

  const { data: slackExt } = await supabase
    .from("workspace_extensions")
    .select("*")
    .eq("ext_name", "slack")
    .single();

  const slackConfig = slackExt?.config as any;
  const isSlackActive = slackExt?.is_active;
  if (!sttText) return null;

  // 2. 맥락 데이터 준비
  const [{ data: logData }, { data: allUsers }] = await Promise.all([
    supabase.from("meeting_logs").select("owner_id").eq("id", id).single(),
    supabase.from("users").select("name").is("deleted_at", null),
  ]);

  const { data: ownerData } = await supabase
    .from("users")
    .select("name")
    .eq("id", logData?.owner_id)
    .single();

  const ownerName = ownerData?.name || "회의 진행자";
  const candidateNames = allUsers?.map((u) => u.name).join(", ") || "";

  const prompt = `당신은 워크프레소의 인공지능 비서입니다. 제공된 STT 결과물을 바탕으로 회의록을 JSON 형식으로 추출하세요.
작성자: ${ownerName}
참여자 후보: [${candidateNames}]
STT 데이터: ${sttText}

출력 형식:
{
  "title": "제목",
  "summary": "3줄 요약",
  "action_items": [{"task": "할 일", "assignee": "담당자", "due_date": "기한"}],
  "participants": ["참여자 목록"]
}`;

  const { meetingRefineModel } = await getResolvedAiConfig();
  const refinedData = await generateJsonObject<{
    title?: string;
    summary?: string;
    action_items?: Array<Record<string, unknown>>;
    participants?: string[];
  }>({
    prompt,
    model: meetingRefineModel,
    temperature: 0,
  });

  // 4. DB 업데이트
  const { error } = await supabase
    .from("meeting_logs")
    .update({
      title: refinedData.title ?? "제목 미정",
      summary: refinedData.summary ?? "",
      action_items: refinedData.action_items ?? [],
      participants: refinedData.participants ?? [],
      is_refined: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // 6. Pod C: 지식 기반 실시간 인덱싱 (비동기 처리 권장하나 서버 액션 내에서 완결성을 위해 await)
  try {
    const { indexKnowledge } = await import('@/features/pod-c/services/knowledgeService');
    const indexText = buildMeetingLogKnowledgeContent({
      title: refinedData.title ?? "제목 미정",
      summary: refinedData.summary ?? "",
      participants: refinedData.participants ?? [],
      actionItems: (refinedData.action_items ?? []) as Array<Record<string, string | number | boolean | null>>,
      transcript: sttText,
    });
    
    await indexKnowledge(id, 'MEETING_LOGS', indexText, {
      title: refinedData.title ?? "제목 미정",
      owner_id: logData?.owner_id
    });
  } catch (idxError) {
    console.error('[Pod D -> C Integration] Indexing failed:', idxError);
    // 인덱싱 실패가 정제 완료 사용자 경험을 방해하지 않도록 에러는 로깅만 수행
  }

  // 5. Slack 알림 연동 (조직 전체 통제)
  if (isSlackActive && slackConfig?.webhookUrl) {
    try {
      // 슬랙 Blocks 레이아웃 구성
      const blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📝 AI 회의 브리핑 도착",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*회의 제목*\n${refinedData.title ?? "제목 미정"}`
            },
            {
              type: "mrkdwn",
              text: `*작성자*\n${ownerName}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*AI 요약*\n${refinedData.summary ?? ""}`
          }
        }
      ];

      // 액션 아이템이 있으면 추가
      if (refinedData.action_items && refinedData.action_items.length > 0) {
        const actionItemsText = refinedData.action_items
          .map((item: any) => `• [${item.assignee || '미정'}] ${item.task}`)
          .join('\n');
        
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*주요 할 일*\n${actionItemsText}`
          }
        } as any);
      }

      // 상세보기 버튼 추가
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "회의록 상세보기",
              emoji: true
            },
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://workpresso.app'}/voice/${id}`,
            style: "primary"
          }
        ]
      } as any);

      await fetch(slackConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🔔 *새로운 회의록 생성 완료*\n*제목:* ${refinedData.title ?? "제목 미정"}\n*작성자:* ${ownerName}\n*요약:* ${refinedData.summary ?? ""}\n\n<${process.env.NEXT_PUBLIC_SITE_URL || "https://workpresso.app"}/voice/${id}|회의록 상세보기>`,
        }),
      });
    } catch (e) {
      console.error("Slack 알림 전송 실패:", e);
    }
  }

  revalidatePath("/voice");
  return { success: true };
}

/**
 * 특정 할 일(Action Item)을 Jira 이슈로 전송하고, DB에 이슈 키를 영구 저장합니다.
 * - Jira 생성 + DB 저장을 서버에서 원자적으로 처리하여 클라이언트 의존성을 제거합니다.
 */
export async function syncActionItemToJiraServer(
  meetingLogId: string,
  itemIndex: number,
  task: string,
  assignee?: string,
  dueDate?: string,
) {
  const supabase = await createClient();

  // 1. 현재 meeting_log의 action_items 조회
  const { data: logData, error: fetchError } = await supabase
    .from('meeting_logs')
    .select('action_items')
    .eq('id', meetingLogId)
    .single();

  if (fetchError) throw new Error(`회의록 조회 실패: ${fetchError.message}`);

  const currentItems: any[] = logData?.action_items || [];

  // 이미 Jira 이슈가 연결된 경우 중복 방지
  if (currentItems[itemIndex]?.jira_key) {
    return {
      success: true,
      issueKey: currentItems[itemIndex].jira_key,
      issueUrl: currentItems[itemIndex].jira_url,
      alreadySynced: true,
    };
  }

  // 2. Jira 이슈 생성
  const { createJiraIssue } = await import('@/features/settings/services/extensionAction');

  const summary = `[회의록 할 일] ${task}`;
  const description = `담당자: ${assignee || '미정'}\n기한: ${dueDate || '없음'}\n\nWorkPresso 회의록에서 자동 생성된 할 일입니다.\n회의록 ID: ${meetingLogId}`;

  const jiraResult = await createJiraIssue({ summary, description });

  // 3. action_items 배열에 Jira 정보 반영 후 DB 저장 (서버에서 직접 처리)
  const updatedItems = [...currentItems];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    jira_key: jiraResult.issueKey,
    jira_url: jiraResult.issueUrl,
  };

  const { error: updateError } = await supabase
    .from('meeting_logs')
    .update({ action_items: updatedItems, updated_at: new Date().toISOString() })
    .eq('id', meetingLogId);

  if (updateError) throw new Error(`Jira 키 DB 저장 실패: ${updateError.message}`);

  revalidatePath(`/voice/${meetingLogId}`);

  return {
    success: true,
    issueKey: jiraResult.issueKey,
    issueUrl: jiraResult.issueUrl,
    updatedItems,
  };
}
