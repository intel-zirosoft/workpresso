/**
 * [Part 5 - API Route: Focus Time Auto-Blocker]
 *
 * POST /api/automation/focus-time
 *  → 오늘 할당된 Jira 이슈 중 우선순위가 높은 항목(Highest / High)에 대해,
 *    WorkPresso 캘린더의 빈 시간대에 '집중 근무' 스케줄을 자동 생성합니다.
 *
 * [동작 흐름]
 *  1. 더미(또는 실제) Jira 이슈 중 Highest/High 우선순위만 필터
 *  2. 오늘 기존 일정을 조회하여 '빈 시간 슬롯'을 계산
 *  3. 이슈 1건당 90분짜리 집중 근무 블록을 빈 슬롯에 삽입
 *  4. 사용자 상태를 ACTIVE(집중 중)로 업데이트
 *
 * [주의 사항]
 *  - 집중 근무 블록 title 앞에 "🎯 [Focus]" 접두어를 붙여 구분합니다.
 *  - 하루 최대 3개 블록만 생성하여 일정 과부하를 방지합니다.
 *  - 이미 [Focus] 블록이 존재하면 중복 생성하지 않습니다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHighPriorityJiraIssues } from "@/lib/jira/client";
import { startOfDay, endOfDay, addMinutes } from "date-fns";

const FOCUS_BLOCK_DURATION_MINUTES = 90;
const MAX_FOCUS_BLOCKS_PER_DAY = 3;
const WORK_START_HOUR = 9;  // 업무 시작 시간
const WORK_END_HOUR = 18;   // 업무 종료 시간

// 기존 일정 목록에서 겹치지 않는 빈 슬롯을 찾습니다.
function findFreeSlot(
  existingSchedules: { start_time: string; end_time: string }[],
  today: Date,
  durationMinutes: number
): { start: Date; end: Date } | null {
  const workStart = new Date(today);
  workStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const workEnd = new Date(today);
  workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

  // 기존 일정을 시간 순으로 정렬
  const sorted = [...existingSchedules].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let cursor = workStart;

  for (const schedule of sorted) {
    const scheduleStart = new Date(schedule.start_time);
    const scheduleEnd = new Date(schedule.end_time);

    const slotEnd = addMinutes(cursor, durationMinutes);

    // cursor부터 다음 일정 전까지 공간이 있으면 슬롯 반환
    if (slotEnd <= scheduleStart) {
      return { start: cursor, end: slotEnd };
    }

    // 겹치면 다음 일정 이후로 cursor 이동
    if (scheduleEnd > cursor) {
      cursor = scheduleEnd;
    }
  }

  // 마지막 일정 이후 공간 확인
  const finalSlotEnd = addMinutes(cursor, durationMinutes);
  if (finalSlotEnd <= workEnd) {
    return { start: cursor, end: finalSlotEnd };
  }

  return null; // 빈 슬롯 없음
}

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    // 1. 오늘 이미 존재하는 일정 조회 (빈 슬롯 계산용)
    const { data: existingSchedules, error: fetchError } = await supabase
      .from("schedules")
      .select("start_time, end_time, title")
      .eq("user_id", user.id)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .is("deleted_at", null)
      .order("start_time", { ascending: true });

    if (fetchError) throw fetchError;

    // 2. 이미 생성된 Focus 블록 개수 확인 (중복 방지)
    const existingFocusCount = (existingSchedules ?? []).filter((s) =>
      s.title.startsWith("🎯 [Focus]")
    ).length;

    if (existingFocusCount >= MAX_FOCUS_BLOCKS_PER_DAY) {
      return NextResponse.json({
        success: true,
        message: `이미 오늘 최대 집중 근무 블록(${MAX_FOCUS_BLOCKS_PER_DAY}개)이 생성되어 있습니다.`,
        existingFocusCount,
      });
    }

    // 3. 높은 우선순위 Jira 이슈 가져오기 (실제 API — 실패 시 더미 폴백)
    const { issues: highPriorityIssues } = await getHighPriorityJiraIssues();

    const created: { title: string; start: string; end: string }[] = [];
    let currentSchedules = [...(existingSchedules ?? [])];

    for (const issue of highPriorityIssues) {
      if (created.length + existingFocusCount >= MAX_FOCUS_BLOCKS_PER_DAY) break;

      const slot = findFreeSlot(currentSchedules, today, FOCUS_BLOCK_DURATION_MINUTES);
      if (!slot) break; // 빈 슬롯 없으면 중단

      const title = `🎯 [Focus] ${issue.key}: ${issue.summary}`;

      const { error } = await supabase.from("schedules").insert({
        user_id: user.id,
        title,
        start_time: slot.start.toISOString(),
        end_time: slot.end.toISOString(),
        type: "TASK",
      });

      if (!error) {
        created.push({
          title,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
        });
        // 새로 추가된 블록을 기존 일정 목록에 합산하여 다음 슬롯 계산 정확도 유지
        currentSchedules.push({
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      isDummy: !process.env.JIRA_API_TOKEN,
      focusBlocksCreated: created.length,
      created,
    });
  } catch (err: any) {
    console.error("[focus-time] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
