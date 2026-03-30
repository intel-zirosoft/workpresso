/**
 * [Part 5 - API Route: Meeting Context Reminder & RSVP]
 *
 * GET  /api/automation/meeting-reminder
 *  → 지금으로부터 10~15분 이내에 시작하는 MEETING 타입 일정을 감지하고,
 *    관련 문서·회의록 링크와 RSVP 버튼이 포함된 Slack 알림을 전송합니다.
 *
 * [동작 흐름]
 *  1. 현재 시간 기준 ±10~15분 범위의 MEETING 일정을 Supabase에서 조회
 *  2. 더미 문서/회의록 URL을 생성 (실제 연동 시 Pod A/D API 호출로 교체)
 *  3. Slack Block Kit으로 포맷 후 전송 (Webhook 없으면 콘솔 출력)
 *
 * [주의 사항]
 *  - 실제 배포 시: Vercel Cron (`vercel.json`)으로 매 5분마다 자동 호출해야 합니다.
 *  - RSVP 버튼 클릭 처리는 /api/slack/actions 라우트가 추가로 필요합니다.
 *  - SLACK_WEBHOOK_URL 없으면 더미 모드(콘솔 출력)로 자동 전환됩니다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildReminderPayload,
  sendReminderMessage,
} from "@/lib/slack/reminder-formatter";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // 앞으로 10~15분 사이에 시작하는 MEETING 일정 조회
    const windowStart = addMinutes(now, 9).toISOString();
    const windowEnd = addMinutes(now, 16).toISOString();

    const { data: upcomingMeetings, error } = await supabase
      .from("schedules")
      .select("id, title, start_time, end_time, type")
      .eq("user_id", user.id)
      .eq("type", "MEETING")
      .gte("start_time", windowStart)
      .lte("start_time", windowEnd)
      .is("deleted_at", null)
      .order("start_time", { ascending: true });

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const isDummy = !process.env.SLACK_WEBHOOK_URL;

    if (!upcomingMeetings || upcomingMeetings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "10분 이내 예정된 회의가 없습니다.",
        checkedAt: now.toISOString(),
        windowStart,
        windowEnd,
      });
    }

    const results = await Promise.all(
      upcomingMeetings.map(async (meeting) => {
        // [더미] 실제 연동 시: Pod A API에서 회의 관련 문서를 조회하여 URL을 가져옵니다.
        const documentUrl = isDummy
          ? `${baseUrl}/documents?search=${encodeURIComponent(meeting.title)}`
          : undefined;

        // [더미] 실제 연동 시: Pod D API에서 직전 회의록을 조회하여 URL을 가져옵니다.
        const meetingNoteUrl = isDummy
          ? `${baseUrl}/voice?meeting=${encodeURIComponent(meeting.title)}`
          : undefined;

        const payload = buildReminderPayload({
          meetingTitle: meeting.title,
          startTime: new Date(meeting.start_time),
          documentUrl,
          meetingNoteUrl,
          isDummy,
        });

        const result = await sendReminderMessage(payload);

        return {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          startTime: meeting.start_time,
          slackResult: result,
          previewPayload: payload, // 개발 중 확인용
        };
      })
    );

    return NextResponse.json({
      success: true,
      remindersCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[meeting-reminder] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
