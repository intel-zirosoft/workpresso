import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  buildMeetingLogKnowledgeContent,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { meetingRefinedPayloadSchema } from "@/features/pod-d/services/meeting-refined-contract";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = meetingRefinedPayloadSchema.parse(await request.json());

    const { data: meetingLog, error: meetingLogError } = await supabase
      .from("meeting_logs")
      .select("id, owner_id")
      .eq("id", payload.meetingLogId)
      .single();

    if (meetingLogError || !meetingLog) {
      return NextResponse.json(
        { error: "Meeting log not found" },
        { status: 404 },
      );
    }

    if (meetingLog.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await upsertKnowledgeSource({
      sourceType: "MEETING_LOGS",
      sourceId: payload.meetingLogId,
      title: payload.title,
      content: buildMeetingLogKnowledgeContent({
        title: payload.title,
        summary: payload.summary,
        participants: payload.participants,
        actionItems: payload.actionItems,
        transcript: payload.transcript,
      }),
      metadata: {
        owner_id: meetingLog.owner_id,
        participants: payload.participants,
        action_items: payload.actionItems,
        updated_at: payload.updatedAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "회의록 knowledge 동기화에 실패했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
