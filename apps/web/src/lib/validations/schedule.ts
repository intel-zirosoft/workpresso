import * as z from "zod";

export const baseScheduleSchema = z.object({
  title: z.string().min(1, "일정 제목을 입력해주세요."),
  start_time: z.string().datetime({ message: "유효한 시작 시간을 입력해주세요 (ISO 8601)." }),
  end_time: z.string().datetime({ message: "유효한 종료 시간을 입력해주세요 (ISO 8601)." }),
  type: z.enum(["TASK", "MEETING", "VACATION", "WFH", "OUTSIDE", "HALF_DAY"]).default("TASK"),
});

export const createScheduleSchema = baseScheduleSchema.refine((data) => new Date(data.start_time) < new Date(data.end_time), {
  message: "종료 시간은 시작 시간보다 이후여야 합니다.",
  path: ["end_time"],
});

export const updateScheduleSchema = baseScheduleSchema.partial().refine((data) => {
  if (data.start_time && data.end_time) {
    return new Date(data.start_time) < new Date(data.end_time);
  }
  return true;
}, {
  message: "종료 시간은 시작 시간보다 이후여야 합니다.",
  path: ["end_time"],
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
