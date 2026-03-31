"use client";

import { CalendarView } from "../_components/calendar-view";

export default function SchedulesPage() {
  return (
    <div className="bg-surface rounded-[32px] px-10 pt-6 pb-10 shadow-soft border border-background/50 h-full">
      <CalendarView variant="full" />
    </div>
  );
}
