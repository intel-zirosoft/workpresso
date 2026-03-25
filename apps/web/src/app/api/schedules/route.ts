import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createScheduleSchema } from "@/lib/validations/schedule";

export async function GET() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null) // 소프트 삭제되지 않은 항목만 가져옴
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

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
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
