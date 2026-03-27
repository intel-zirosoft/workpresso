import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, department, status, created_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (usersError || !users) {
    return NextResponse.json({ error: usersError?.message || "Users not found" }, { status: 500 });
  }

  // Fetch active schedules for all users to sync status automatically
  const now = new Date().toISOString();
  const { data: activeSchedules } = await supabase
    .from("schedules")
    .select("user_id, type")
    .lte("start_time", now)
    .gte("end_time", now);

  // Map active schedules by user_id
  const schedulesMap = (activeSchedules || []).reduce((acc: Record<string, string>, curr: { user_id: string; type: string }) => {
    acc[curr.user_id] = curr.type;
    return acc;
  }, {});

  // Update user status based on active schedules (System Schedule Priority)
  const syncedUsers = users.map((u: any) => {
    const activeType = schedulesMap[u.id];
    let syncedStatus = u.status;

    if (activeType) {
      if (activeType === 'MEETING') syncedStatus = 'MEETING';
      else if (activeType === 'VACATION') syncedStatus = 'VACATION';
      else if (activeType === 'WFH') syncedStatus = 'REMOTE';
      else if (activeType === 'OUTSIDE') syncedStatus = 'OUTSIDE';
      else if (activeType === 'HALF_DAY') syncedStatus = 'HALF_DAY';
    }

    return {
      ...u,
      status: syncedStatus,
      isAutoSynced: !!activeType && syncedStatus !== u.status
    };
  });

  return NextResponse.json(syncedUsers);
}
