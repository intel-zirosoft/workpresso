/**
 * [Part 5 - API Route: Jira Due Date → WorkPresso Calendar Sync]
 *
 * POST /api/automation/jira-sync
 *  → 더미 Jira 이슈의 마감일을 WorkPresso 캘린더(schedules 테이블)에 자동 등록합니다.
 *  → 이미 동일 Jira Key로 등록된 일정이 있으면 SKIP하여 중복 생성을 방지합니다.
 *
 * [동작 흐름]
 *  1. 더미(또는 실제) Jira 이슈 목록 조회
 *  2. 각 이슈의 dueDate를 기준으로 schedules 테이블에 종일(All-day) 일정 생성
 *  3. 이미 존재하는 Jira 마감일 일정은 건너뜀 (idempotent 처리)
 *
 * [실제 연동 전환 방법]
 *  - getDummyJiraIssues() → 실제 Jira REST API 호출 함수로 교체
 *  - JIRA_API_TOKEN, JIRA_BASE_URL 환경변수 세팅 후 사용
 *
 * [주의 사항]
 *  - 이 엔드포인트는 POST로 명시적으로 호출하거나, Vercel Cron으로 주기적으로 실행합니다.
 *  - 자동 생성된 일정의 title 앞에 "[Jira]" 접두어를 붙여 구분합니다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDummyJiraIssues } from "@/lib/dummy-data/jira";
import { startOfDay, endOfDay } from "date-fns";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Jira 이슈 목록 가져오기 (현재: 더미 데이터)
    const jiraIssues = getDummyJiraIssues();

    const results: { key: string; status: "created" | "skipped" | "error"; title?: string }[] = [];

    for (const issue of jiraIssues) {
      const dueDate = new Date(issue.dueDate);
      const titleTag = `[Jira] ${issue.key}: ${issue.summary}`;

      // 2. 중복 확인: 동일한 Jira Key 제목이 이미 존재하면 스킵
      const { data: existing } = await supabase
        .from("schedules")
        .select("id")
        .eq("user_id", user.id)
        .ilike("title", `%${issue.key}%`)
        .gte("start_time", startOfDay(dueDate).toISOString())
        .lte("start_time", endOfDay(dueDate).toISOString())
        .maybeSingle();

      if (existing) {
        results.push({ key: issue.key, status: "skipped" });
        continue;
      }

      // 3. 캘린더 일정으로 등록 (종일: 09:00 ~ 18:00)
      const startTime = new Date(dueDate);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(dueDate);
      endTime.setHours(18, 0, 0, 0);

      const { error } = await supabase.from("schedules").insert({
        user_id: user.id,
        title: titleTag,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: "TASK",
      });

      if (error) {
        results.push({ key: issue.key, status: "error" });
      } else {
        results.push({ key: issue.key, status: "created", title: titleTag });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      success: true,
      isDummy: !process.env.JIRA_API_TOKEN,
      summary: { created, skipped, total: results.length },
      results,
    });
  } catch (err: any) {
    console.error("[jira-sync] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
