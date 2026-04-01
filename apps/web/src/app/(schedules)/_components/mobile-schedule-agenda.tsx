"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import {
  addDays,
  format,
  isThisWeek,
  isToday,
  isTomorrow,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import {
  fetchSchedules,
  type Schedule,
  ScheduleApiError,
} from "./schedule-api";

type FocusMode = "today" | "week";

const TYPE_LABEL: Record<string, string> = {
  HALF_DAY: "반차",
  MEETING: "회의",
  OUTSIDE: "외근",
  TASK: "업무",
  VACATION: "휴가",
  WFH: "재택",
};

function getErrorMessage(error: unknown) {
  if (error instanceof ScheduleApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "일정을 불러오지 못했습니다.";
}

function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}

function formatTimeRange(schedule: Schedule) {
  return `${format(new Date(schedule.start_time), "HH:mm")} - ${format(
    new Date(schedule.end_time),
    "HH:mm",
  )}`;
}

function formatDayLabel(date: Date) {
  if (isToday(date)) {
    return "오늘";
  }

  if (isTomorrow(date)) {
    return "내일";
  }

  return format(date, "M월 d일 (EEE)", { locale: ko });
}

export function MobileScheduleAgenda({
  initialFocus = "today",
}: {
  initialFocus?: FocusMode;
}) {
  const [focus, setFocus] = useState<FocusMode>(initialFocus);
  const { data: schedules = [], error, isError, isLoading } = useQuery<Schedule[]>(
    {
      queryKey: ["schedules"],
      queryFn: fetchSchedules,
    },
  );

  const sortedSchedules = useMemo(() => sortSchedules(schedules), [schedules]);
  const now = new Date();
  const weekEnd = addDays(now, 7);

  const todaySchedules = useMemo(
    () =>
      sortedSchedules.filter((schedule) =>
        isToday(new Date(schedule.start_time)),
      ),
    [sortedSchedules],
  );

  const weekSchedules = useMemo(
    () =>
      sortedSchedules.filter((schedule) => {
        const date = new Date(schedule.start_time);
        return (
          isThisWeek(date, { locale: ko, weekStartsOn: 1 }) ||
          (date > now && date <= weekEnd)
        );
      }),
    [now, sortedSchedules, weekEnd],
  );

  const upcomingMeetings = useMemo(
    () =>
      sortedSchedules
        .filter((schedule) => {
          const date = new Date(schedule.start_time);
          return schedule.type === "MEETING" && date >= now;
        })
        .slice(0, 3),
    [now, sortedSchedules],
  );

  const visibleAgenda = focus === "today" ? todaySchedules : weekSchedules;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
          Mobile Agenda
        </p>
        <h1 className="mt-2 font-headings text-[26px] font-bold leading-tight">
          오늘과 이번 주 일정부터 빠르게 확인하세요.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          앱에서는 월간 캘린더 조작보다 오늘 일정, 이번 주 일정, 곧 시작할
          회의를 우선 보여줍니다.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              오늘 일정
            </p>
            <p className="mt-2 text-2xl font-headings font-bold">
              {todaySchedules.length}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              이번 주
            </p>
            <p className="mt-2 text-2xl font-headings font-bold">
              {weekSchedules.length}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              곧 시작할 회의
            </p>
            <p className="mt-2 text-2xl font-headings font-bold">
              {upcomingMeetings.length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headings text-lg font-bold text-text">
              우선 확인할 일정
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              월간 편집보다 확인 중심의 agenda 흐름입니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background/70 p-1">
            <button
              type="button"
              onClick={() => setFocus("today")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                focus === "today"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-muted",
              )}
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => setFocus("week")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                focus === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-muted",
              )}
            >
              이번 주
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex min-h-28 items-center justify-center text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-warning/20 bg-warning-soft px-4 py-4 text-sm text-text">
              {getErrorMessage(error)}
            </div>
          ) : visibleAgenda.length > 0 ? (
            visibleAgenda.map((schedule) => {
              const date = new Date(schedule.start_time);

              return (
                <div
                  key={schedule.id}
                  className="rounded-[22px] border border-background/70 bg-background/30 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
                        {TYPE_LABEL[schedule.type ?? "TASK"] ?? "일정"}
                      </p>
                      <h3 className="mt-1 truncate font-headings text-lg font-bold text-text">
                        {schedule.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
                      {formatDayLabel(date)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-xs font-semibold text-text-muted">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimeRange(schedule)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-xs font-semibold text-text-muted">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(date, "M월 d일 (EEEE)", { locale: ko })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-background/80 bg-background/30 px-4 py-8 text-center">
              <p className="font-headings text-base font-bold text-text">
                {focus === "today"
                  ? "오늘 일정이 없습니다"
                  : "이번 주 예정된 일정이 없습니다"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                중요한 일정이 생기면 이 화면에서 먼저 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
              빠른 확인
            </p>
            <h2 className="mt-1 font-headings text-xl font-bold text-text">
              곧 시작할 회의
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              가까운 회의 일정을 별도로 모아 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-[22px] bg-primary/5 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
                      회의
                    </p>
                    <h3 className="mt-1 truncate font-headings text-lg font-bold text-text">
                      {schedule.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted">
                      {format(new Date(schedule.start_time), "M월 d일 (EEE)", {
                        locale: ko,
                      })}{" "}
                      · {formatTimeRange(schedule)}
                    </p>
                  </div>
                  <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-background/80 bg-background/30 px-4 py-8 text-center">
              <p className="font-headings text-base font-bold text-text">
                곧 시작할 회의가 없습니다
              </p>
              <p className="mt-2 text-sm text-text-muted">
                오늘과 이번 주의 업무 일정부터 확인해 보세요.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[22px] bg-primary/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headings text-base font-bold text-text">
                FullCalendar 조작은 뒤로
              </p>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                앱에서는 월간 이동, 드래그 편집, 세부 조작보다 오늘 일정과 가까운
                회의를 빨리 확인할 수 있게 단순화했습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
