import { z } from "zod";

import { baseScheduleSchema } from "@/lib/validations/schedule";

export const createScheduleToolSchema = baseScheduleSchema
  .extend({
    description: z.string().optional(),
    attendee_ids: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => new Date(data.start_time) < new Date(data.end_time), {
    message: "종료 시간은 시작 시간보다 이후여야 합니다.",
    path: ["end_time"],
  });

const createdScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  type: z.string().nullable().optional(),
});

export type CreateScheduleToolInput = z.infer<typeof createScheduleToolSchema>;

export async function createScheduleViaPodBApi(input: {
  payload: CreateScheduleToolInput;
  request: Request;
}) {
  const payload = createScheduleToolSchema.parse(input.payload);
  const scheduleApiUrl = new URL("/api/schedules", input.request.url);
  const cookieHeader = input.request.headers.get("cookie");

  const response = await fetch(scheduleApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      type: payload.type,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ error: "일정 생성에 실패했습니다." }));

    const message =
      typeof errorPayload?.error === "string"
        ? errorPayload.error
        : "일정 생성에 실패했습니다.";

    throw new Error(message);
  }

  const createdSchedule = createdScheduleResponseSchema.parse(
    await response.json(),
  );

  return {
    ...createdSchedule,
    description: payload.description ?? null,
    attendee_ids: payload.attendee_ids ?? [],
    link: new URL("/schedules", input.request.url).toString(),
  };
}
