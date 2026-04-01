import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addHours } from "date-fns";

export async function POST() {
  const supabase = await createClient();

  // 1. 유저 인증
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. 최근 7일 내의 본인 소유 음성 회의록 (meeting_logs) 조회 (정제 완료된 건만)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: meetingLogs, error: logError } = await supabase
      .from("meeting_logs")
      .select("id, title, summary, created_at")
      .eq("owner_id", user.id)
      .eq("is_refined", true)
      .gte("created_at", sevenDaysAgo.toISOString())
      .is("deleted_at", null);

    if (logError) throw logError;
    if (!meetingLogs || meetingLogs.length === 0) {
      return NextResponse.json({
        syncedCount: 0,
        message: "No recent refined meeting logs found.",
      });
    }

    // 3. 기존에 동기화된 일정이 있는지 캘린더 (schedules) 조회
    // 멱등성 검사: 제목이 "[🎙️]" 로 시작하는 일정들만 가져옵니다.
    const { data: existingSchedules, error: scheduleError } = await supabase
      .from("schedules")
      .select("title, start_time")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .like("title", "[🎙️]%");

    if (scheduleError) throw scheduleError;

    // 4. 동기화 안 된 회의록 필터링 및 동기화 배열 생성
    const newSchedules = [];

    for (const log of meetingLogs) {
      const baseTitle = log.title || "새로운 회의";
      const summaryText = log.summary || "요약 내용이 없습니다.";
      
      // AI 세부 요약본 (details) 구조화
      const details = [
        {
          sub_id: `detail_${log.id.substring(0, 8)}`,
          content: summaryText,
          tags: ["AI 요약", "회의록"]
        }
      ];

      // 이미 동기화된 항목이 있는지 검사 (같은 날짜에 동일한 baseTitle이 있으면 스킵)
      const isAlreadySynced = existingSchedules?.some((schedule) => {
        const timeDiff = Math.abs(
          new Date(schedule.start_time).getTime() -
            new Date(log.created_at).getTime(),
        );
        const isSameDay = timeDiff < 1000 * 60 * 60 * 24;
        return schedule.title === baseTitle && isSameDay;
      });

      if (!isAlreadySynced) {
        newSchedules.push({
          user_id: user.id,
          title: baseTitle,
          start_time: log.created_at,
          end_time: addHours(new Date(log.created_at), 1).toISOString(),
          type: "MEETING",
          has_voice: true,
          metadata: details,
        });
      }
    }

    if (newSchedules.length === 0) {
      return NextResponse.json({
        syncedCount: 0,
        message: "All logs are already synced.",
      });
    }

    // 5. 새로운 캘린더 일정 다중 삽입 (schedules)
    const { data: insertedSchedules, error: insertError } = await supabase
      .from("schedules")
      .insert(newSchedules)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      syncedCount: insertedSchedules.length,
      schedules: insertedSchedules,
    });
  } catch (error: any) {
    console.error("voice-sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync voice schedules" },
      { status: 500 },
    );
  }
}
