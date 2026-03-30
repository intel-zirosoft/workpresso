/**
 * [Part 5 - API Route: Daily Morning Briefing]
 *
 * GET  /api/automation/daily-briefing
 *  → 오늘 일정 + 더미 Jira 이슈를 합쳐서 Slack Block Kit 페이로드를 생성합니다.
 *  → SLACK_WEBHOOK_URL 환경변수가 있으면 실제 전송, 없으면 콘솔(더미 모드)로 동작합니다.
 *
 * [주의 사항]
 *  - 실제 배포 시 Cron Job(Vercel Cron 또는 서버 스케줄러)으로 매일 아침 호출해야 합니다.
 *  - SLACK_WEBHOOK_URL은 반드시 .env.local에만 보관하고 코드에는 절대 하드코딩하지 마세요.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildBriefingPayload, sendSlackBriefing } from "@/lib/slack/briefing-formatter";
import { getDummyJiraIssues } from "@/lib/dummy-data/jira";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 오늘 일정 조회 (실제 DB에서)
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    const { data: schedules, error } = await supabase
      .from("schedules")
      .select("title, start_time, end_time, type")
      .eq("user_id", user.id)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .is("deleted_at", null)
      .order("start_time", { ascending: true });

    if (error) throw error;

    // 2. Jira 이슈 가져오기 (현재는 더미 데이터 사용)
    //    실제 연동 시: getJiraIssuesDueToday(user.email) 와 같은 함수로 교체
    const isDummy = !process.env.JIRA_API_TOKEN;
    const jiraIssues = getDummyJiraIssues();

    // 3. Slack Block Kit 페이로드 생성
    const payload = buildBriefingPayload(schedules ?? [], jiraIssues, isDummy);

    // 4. Slack 전송 (SLACK_WEBHOOK_URL 없으면 콘솔 출력)
    const result = await sendSlackBriefing(payload);

    return NextResponse.json({
      success: true,
      mode: result.mode,
      previewPayload: payload, // 개발 중 UI에서 페이로드 미리보기 가능
    });
  } catch (err: any) {
    console.error("[daily-briefing] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
