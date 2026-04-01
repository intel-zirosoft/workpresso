"use client";

import { useSearchParams } from "next/navigation";

import { useEmbeddedMobileApp } from "@/lib/mobile-app";

import { CalendarView } from "./calendar-view";
import { MobileScheduleAgenda } from "./mobile-schedule-agenda";

export function ScheduleWorkspace() {
  const searchParams = useSearchParams();
  const isEmbeddedMobile = useEmbeddedMobileApp();
  const mobile = searchParams.get("mobile") === "1";
  const focus = searchParams.get("focus");

  if (isEmbeddedMobile || mobile || focus === "today" || focus === "week") {
    return (
      <MobileScheduleAgenda
        initialFocus={focus === "week" ? "week" : "today"}
      />
    );
  }

  return (
    <div className="h-full rounded-[32px] border border-background/50 bg-surface px-10 pb-10 pt-6 shadow-soft">
      <CalendarView variant="full" />
    </div>
  );
}
