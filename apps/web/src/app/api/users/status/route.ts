import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'VACATION', 'MEETING', 'OFFLINE', 'REMOTE', 'OUTSIDE', 'HALF_DAY']),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { status: requestedStatus } = updateStatusSchema.parse(json);

    // [System Schedule Priority] Check for active schedules that should override manual status
    const now = new Date().toISOString();
    const { data: activeSchedules } = await supabase
      .from("schedules")
      .select("type")
      .eq("user_id", user.id)
      .lte("start_time", now)
      .gte("end_time", now);

    let effectiveStatus = requestedStatus;

    if (activeSchedules && activeSchedules.length > 0) {
      // Priority: VACATION > OUTSIDE > HALF_DAY > MEETING > WFH
      const types = activeSchedules.map((s: any) => s.type);
      if (types.includes('VACATION')) effectiveStatus = 'VACATION';
      else if (types.includes('OUTSIDE')) effectiveStatus = 'OUTSIDE';
      else if (types.includes('HALF_DAY')) effectiveStatus = 'HALF_DAY';
      else if (types.includes('MEETING')) effectiveStatus = 'MEETING';
      else if (types.includes('WFH')) effectiveStatus = 'REMOTE';
    }

    const { data, error } = await supabase
      .from("users")
      .update({ 
        status: effectiveStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ...data,
      isOverridden: effectiveStatus !== requestedStatus,
      originalRequestedStatus: requestedStatus
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
