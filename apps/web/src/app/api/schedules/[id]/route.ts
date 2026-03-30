import { NextResponse } from "next/server";
import {
  buildScheduleKnowledgeContent,
  removeKnowledgeSource,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { createClient } from "@/lib/supabase/server";
import { updateScheduleSchema } from "@/lib/validations/schedule";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = updateScheduleSchema.parse(json);

    const { data, error } = await supabase
      .from("schedules")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id) // 내 일정인지 확인 (RLS가 하지만 추가 검증)
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

    return NextResponse.json(data);
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 소프트 삭제 (deleted_at 업데이트)
  const { error } = await supabase
    .from("schedules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await removeKnowledgeSource({
      sourceType: "SCHEDULES",
      sourceId: params.id,
    });
  } catch (syncError) {
    console.error("schedule knowledge removal failed:", syncError);
  }

  return new NextResponse(null, { status: 204 });
}
