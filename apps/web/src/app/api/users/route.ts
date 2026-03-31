import { NextResponse } from "next/server";

import { normalizeDocumentUserRow } from "@/features/pod-a/services/document-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UserStatus =
  | "ACTIVE"
  | "VACATION"
  | "MEETING"
  | "OFFLINE"
  | "REMOTE"
  | "OUTSIDE"
  | "HALF_DAY";


type ActiveScheduleRow = {
  user_id: string;
  type: "MEETING" | "VACATION" | "WFH" | "OUTSIDE" | "HALF_DAY";
};

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "사용자 목록을 확인하려면 로그인이 필요합니다." },
    { status: 401 },
  );
}

function syncUserStatus(
  baseStatus: string | null | undefined,
  activeTypes: ActiveScheduleRow["type"][],
): UserStatus {
  if (activeTypes.includes("VACATION")) {
    return "VACATION";
  }

  if (activeTypes.includes("OUTSIDE")) {
    return "OUTSIDE";
  }

  if (activeTypes.includes("HALF_DAY")) {
    return "HALF_DAY";
  }

  if (activeTypes.includes("MEETING")) {
    return "MEETING";
  }

  if (activeTypes.includes("WFH")) {
    return "REMOTE";
  }

  return (baseStatus as UserStatus | null) ?? "ACTIVE";
}

export async function GET() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  try {
    const { data: rawUsers, error: usersError } = await adminSupabase
      .from("users")
      .select("id, name, department, status")
      .is("deleted_at", null)
      .order("department", { ascending: true })
      .order("name", { ascending: true });

    if (usersError) {
      throw new Error("사용자 목록을 불러오지 못했습니다.");
    }

    const now = new Date().toISOString();
    const { data: activeSchedules, error: schedulesError } = await adminSupabase
      .from("schedules")
      .select("user_id, type")
      .lte("start_time", now)
      .gte("end_time", now);

    if (schedulesError) {
      throw new Error("일정 상태를 불러오지 못했습니다.");
    }

    const schedulesByUserId = (activeSchedules ?? []).reduce<
      Record<string, ActiveScheduleRow["type"][]>
    >((acc, schedule) => {
      const currentSchedules = acc[schedule.user_id] ?? [];

      currentSchedules.push(schedule.type as ActiveScheduleRow["type"]);
      acc[schedule.user_id] = currentSchedules;

      return acc;
    }, {});

    const users = (rawUsers ?? []).map((row) => {
      const normalizedUser = normalizeDocumentUserRow(row);
      const syncedStatus = syncUserStatus(
        row.status,
        schedulesByUserId[row.id] ?? [],
      );

      return {
        ...normalizedUser,
        status: syncedStatus,
        isAutoSynced: syncedStatus !== ((row.status as UserStatus | null) ?? "ACTIVE"),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "사용자 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
