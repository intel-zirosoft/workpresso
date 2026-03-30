"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildMeetingLogKnowledgeContent,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { revalidatePath } from "next/cache";

/**
 * DB에서 시스템 설정을 가져와 실제 AI 리파인먼트를 수행합니다. (보안 강화 및 멀티 엔진 지원)
 */
export async function refineMeetingLogServer(id: string, sttText: string) {
  const supabase = await createClient();

  // 1. 시스템 설정 가져오기 (LLM & Slack)
  const { data: llmExt } = await supabase
    .from("workspace_extensions")
    .select("*")
    .eq("ext_name", "system_llm")
    .single();

  const { data: slackExt } = await supabase
    .from("workspace_extensions")
    .select("*")
    .eq("ext_name", "slack")
    .single();

  const llmConfig = llmExt?.config as any;
  const isLlmActive = llmExt?.is_active;
  const slackConfig = slackExt?.config as any;
  const isSlackActive = slackExt?.is_active;

  // 설정 기반 엔진 선택
  const provider = isLlmActive ? llmConfig?.provider : "gemini";
  const apiKey = isLlmActive ? llmConfig?.apiKey : process.env.GEMINI_API_KEY;

  if (!apiKey)
    throw new Error(
      "AI 서비스가 구성되지 않았습니다. 관리자 설정에서 API 키를 입력해 주세요.",
    );
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

  let refinedData;

  // 3. 엔진별 API 호출 스위칭
  if (provider?.toLowerCase().includes("openai")) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    const result = await response.json();
    refinedData = JSON.parse(result.choices?.[0]?.message?.content || "{}");
  } else {
    // Default Gemini
    const model = provider || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      },
    );
    const result = await response.json();
    refinedData = JSON.parse(
      result.candidates?.[0]?.content?.parts?.[0]?.text || "{}",
    );
  }

  // 4. DB 업데이트
  const { error } = await supabase
    .from("meeting_logs")
    .update({
      title: refinedData.title,
      summary: refinedData.summary,
      action_items: refinedData.action_items,
      participants: refinedData.participants,
      is_refined: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await upsertKnowledgeSource({
      sourceType: "MEETING_LOGS",
      sourceId: id,
      title: refinedData.title,
      content: buildMeetingLogKnowledgeContent({
        title: refinedData.title,
        summary: refinedData.summary,
        participants: refinedData.participants,
        actionItems: Array.isArray(refinedData.action_items)
          ? refinedData.action_items
          : [],
        transcript: sttText,
      }),
      metadata: {
        owner_id: logData?.owner_id ?? null,
        title: refinedData.title ?? null,
        summary: refinedData.summary ?? null,
        participants: Array.isArray(refinedData.participants)
          ? refinedData.participants
          : [],
        action_items: Array.isArray(refinedData.action_items)
          ? refinedData.action_items
          : [],
        transcript: sttText,
        is_refined: true,
      },
    });
  } catch (syncError) {
    console.error("회의록 지식 동기화 실패:", syncError);
  }

  // 5. Slack 알림 연동 (조직 전체 통제)
  if (isSlackActive && slackConfig?.webhookUrl) {
    try {
      await fetch(slackConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🔔 *새로운 회의록 생성 완료*\n*제목:* ${refinedData.title}\n*작성자:* ${ownerName}\n*요약:* ${refinedData.summary}\n\n<${process.env.NEXT_PUBLIC_SITE_URL || "https://workpresso.app"}/voice/${id}|회의록 상세보기>`,
        }),
      });
    } catch (e) {
      console.error("Slack 알림 전송 실패:", e);
    }
  }

  revalidatePath("/voice");
  return { success: true };
}
