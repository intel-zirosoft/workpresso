import { createClient } from "@/lib/supabase/client";
import { GEMINI_API_KEY, GEMINI_MODEL } from "./sttService";

const supabase = createClient();

export interface MeetingLog {
  id: string;
  owner_id: string;
  audio_url: string;
  stt_text: string | null;
  title: string | null;
  summary: string | null;
  action_items: any[] | null;
  participants: string[] | null;
  is_refined: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MeetingLogInsert {
  owner_id: string;
  audio_url: string;
}

const transformLog = (log: any): MeetingLog => {
  const transformed = {
    ...log,
    audio_url:
      log.audio_url && !log.audio_url.startsWith("http")
        ? `/api/audio/${log.audio_url}`
        : log.audio_url,
  };
  return transformed;
};

export const createMeetingLog = async (log: MeetingLogInsert) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .insert([log])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const updateMeetingLogSTT = async (id: string, sttText: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .update({ stt_text: sttText })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting log STT: ${error.message}`);
  }

  return transformLog(data);
};

/**
 * AI를 사용하여 STT 원본 텍스트를 변환된 회의록(제목, 요약, 액션 아이템 등)으로 변환합니다.
 */
export const refineMeetingLog = async (id: string, sttText: string) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  if (!sttText || sttText === "음성이 인식되지 않았습니다.") {
    return null;
  }

  // 1. 회의록 정보와 모든 사용자 명단 가져오기
  const [{ data: logData }, { data: allUsers }] = await Promise.all([
    supabase.from("meeting_logs").select("owner_id").eq("id", id).single(),
    supabase.from("users").select("name").is("deleted_at", null),
  ]);

  if (!logData) throw new Error("Meeting log not found");

  // 2. 작성자(Owner) 이름 가져오기
  const { data: ownerData } = await supabase
    .from("users")
    .select("name")
    .eq("id", logData.owner_id)
    .single();

  const ownerName = ownerData?.name || "회의 진행자";
  const candidateNames = allUsers?.map((u) => u.name).join(", ") || "";

  const prompt = `
당신은 최고의 비서입니다. 제공된 회의 STT(Speech-to-Text) 결과물을 바탕으로 회의록을 변환해 주세요.
반드시 아래의 **JSON 형식**으로만 답변하세요. 다른 부연 설명은 하지 마세요.

**특별 지침:**
- 이번 회의의 작성자(진행자)는 **"${ownerName}"** 입니다. 이 이름을 최우선으로 'participants' 목록에 포함하세요.
- 회의에 참여했을 가능성이 있는 팀원 명단은 다음과 같습니다: [${candidateNames}]
- STT 내용에서 화자가 바뀌거나 호칭(예: "~님", "대리님" 등)이 등장하면 위 팀원 명단 중 가장 유사한 이름을 찾아 'participants' 목록에 매칭해 주세요.
- 명단에 없는 이름이라도 대화 문맥상 명확한 참여자라면 목록에 추가하세요.

JSON 구조:
{
  "title": "회의의 핵심 주제를 담은 짧은 제목",
  "summary": "회의 내용을 3~5줄로 요약한 본문",
  "action_items": [
    {"task": "할 일 내용", "assignee": "담당자 이름(파악 안 되면 빈칸)", "due_date": "기한(파악 안 되면 빈칸)"}
  ],
  "participants": ["회의에 참여한 사람들의 이름 목록 (반드시 '${ownerName}' 포함)"]
}

회의 STT 내용:
"${sttText}"
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini API refinement failed");
  }

  const result = await response.json();
  const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  console.log("Gemini Refinement Result:", rawJson);

  try {
    const refinedData = JSON.parse(rawJson);
    console.log("Parsed Refined Data:", refinedData);

    // DB 업데이트
    const { data, error } = await supabase
      .from("meeting_logs")
      .update({
        title: refinedData.title,
        summary: refinedData.summary,
        action_items: refinedData.action_items,
        participants: refinedData.participants,
        is_refined: true,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return transformLog(data);
  } catch (err) {
    console.error("Failed to parse Gemini response or update DB:", err);
    throw new Error("Failed to refine meeting log");
  }
};

export const updateMeetingLog = async (id: string, updates: Partial<MeetingLog>) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const getMeetingLog = async (id: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const listMeetingLogs = async (ownerId: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list meeting logs: ${error.message}`);
  }

  return (data ?? []).map(transformLog);
};

export const deleteMeetingLog = async (id: string) => {
  const { error } = await supabase
    .from("meeting_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete meeting log: ${error.message}`);
  }
};

export const deleteMeetingLogs = async (ids: string[]) => {
  const { error } = await supabase
    .from("meeting_logs")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to delete meeting logs: ${error.message}`);
  }
};
