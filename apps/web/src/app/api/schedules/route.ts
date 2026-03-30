import { NextResponse } from "next/server";
import {
  buildScheduleKnowledgeContent,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { createClient } from "@/lib/supabase/server";
import { createScheduleSchema } from "@/lib/validations/schedule";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .is("deleted_at", null) // 소프트 삭제되지 않은 항목만 가져옴
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = createScheduleSchema.parse(json);

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        title: body.title,
        start_time: body.start_time,
        end_time: body.end_time,
        type: body.type, // 추가된 타입 정보 저장
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    try {
      await upsertKnowledgeSource({
        sourceType: "SCHEDULES",
        sourceId: data.id,
        title: data.title,
        content: buildScheduleKnowledgeContent({
          title: data.title,
          startTime: data.start_time,
          endTime: data.end_time,
          type: data.type,
        }),
        metadata: {
          user_id: user.id,
          type: data.type ?? null,
          start_time: data.start_time,
          end_time: data.end_time,
        },
      });
    } catch (syncError) {
      console.error("schedule knowledge sync failed:", syncError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
