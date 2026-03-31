"use client";

import { CalendarView } from "../_components/calendar-view";

export default function SchedulesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-headings font-bold text-text tracking-tight">
          업무 일정 관리
        </h1>
        <p className="text-muted font-headings font-medium mt-1">
          나의 스케줄을 확인하고 관리하세요.
        </p>
      </header>

      <div className="bg-surface rounded-2xl p-8 shadow-soft border border-background/50">
        <CalendarView variant="full" />
      </div>
    </div>
  );
}
