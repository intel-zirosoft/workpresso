"use client";

export interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type?: string;
  has_voice?: boolean;
  metadata?: any[];
}

export type ScheduleInput = Omit<Schedule, "id">;
export type ScheduleUpdateInput = Partial<ScheduleInput>;

export class ScheduleApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleApiError";
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if ("error" in data) {
    if (typeof data.error === "string") {
      return data.error;
    }

    if (Array.isArray(data.error)) {
      const firstMessage = data.error.find(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "message" in entry &&
          typeof entry.message === "string",
      );

      if (firstMessage && typeof firstMessage.message === "string") {
        return firstMessage.message;
      }
    }
  }

  return fallback;
}

async function parseResponse<T>(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ScheduleApiError(extractErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

export async function fetchSchedules() {
  // 캘린더 일정을 불러오기 전, 음성 회의록(meeting_logs) 변경분을 자동 동기화합니다.
  try {
    await fetch("/api/automation/voice-sync", { method: "POST" });
  } catch (syncError) {
    console.warn("voice_sync failed during fetchSchedules:", syncError);
  }

  const response = await fetch("/api/schedules", {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<Schedule[]>(response, "일정을 불러오지 못했습니다.");
}

export async function createSchedule(input: ScheduleInput) {
  const response = await fetch("/api/schedules", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Schedule>(response, "일정 생성에 실패했습니다.");
}

export async function updateSchedule(id: string, input: ScheduleUpdateInput) {
  const response = await fetch(`/api/schedules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Schedule>(response, "일정 수정에 실패했습니다.");
}

export async function deleteSchedule(id: string) {
  const response = await fetch(`/api/schedules/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ScheduleApiError(
      extractErrorMessage(data, "일정 삭제에 실패했습니다."),
    );
  }
}
