import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const dummyLog = {
      owner_id: user.id,
      title: "기능 개편 상세 리뷰",
      summary: "일정 모달 상세보기 팝업 추가 및 디자인 리팩토링 검토. 사용자가 제목 하단의 요약본을 누르면 모달 창이 부드럽게 나타나도록 개선.",
      is_refined: true,
      action_items: ["메인 일러스트 변경 작업", "폰트 사이즈 조절"],
      participants: ["사용자", "팀원 A", "팀원 B"],
      created_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from("meeting_logs")
      .insert([dummyLog])
      .select()
      .single();

    if (error) throw error;

    // 2. 캘린더 일정(schedules)도 동시에 생성하여 연동 확인
    const { error: scheduleError } = await supabase.from("schedules").insert({
      user_id: user.id,
      title: "주간 업무 회의",
      start_time: now.toISOString(),
      end_time: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      type: "MEETING",
      has_voice: true,
      metadata: [
        {
          sub_id: "seed_1",
          content: "지난 주 성과 공유 및 이번 주 주요 목표 설정. 특히 Pod-B 모듈의 v1.0 완성에 집중하기로 함.",
          tags: ["AI 요약", "주요 안건"]
        },
        {
          sub_id: "seed_2",
          content: "기존의 구분자 기반 데이터를 JSONB 형식으로 마이그레이션하는 방안 검토 완료.",
          tags: ["기술적 결정"]
        }
      ]
    });

    if (scheduleError) throw scheduleError;

    return NextResponse.json({
      success: true,
      message: "더미 회의록 생성 성공",
      data,
    });
  } catch (err: any) {
    console.error("seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
