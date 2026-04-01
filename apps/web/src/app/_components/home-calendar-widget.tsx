"use client";

import { Calendar } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Dummy schedules matching the mockup
const MOCK_SCHEDULES = [
  {
    id: "1",
    time: "10:00",
    title: "주간 팀 싱크업 회의",
    desc: "대회의실 A / 화상회의 동시진행",
    color: "bg-primary",
  },
  {
    id: "2",
    time: "14:30",
    title: "신규 프로덕트 디자인 리뷰",
    desc: "기획서 2번 항목 중점 검토",
    color: "bg-secondary",
  },
  {
    id: "3",
    time: "16:00",
    title: "협력사 계약 서류 검토",
    desc: "법무팀 피드백 확인 필요",
    color: "bg-muted-foreground/50",
  },
];

export function HomeCalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="rounded-[28px] border border-background/60 bg-surface shadow-soft p-6 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-12 w-full h-full">
      {/* Left: Mini Calendar */}
      <div className="flex-shrink-0 md:w-[320px] lg:w-[350px]">
        {/* We use standard Calendar from ui/calendar, customizing some CSS if needed, but standard mode looks very similar to mockup */}
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ko}
          className="p-0 border-0"
          classNames={{
            months: "w-full",
            month: "w-full space-y-4",
            caption: "flex justify-between pt-1 relative items-center mb-6",
            caption_label: "text-xl font-headings font-bold text-text",
            nav: "space-x-1 flex items-center",
            head_row: "flex w-full mb-3",
            head_cell: "text-text-muted font-bold text-[10px] w-10 md:w-11 lg:w-12 text-center",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 w-10 md:w-11 lg:w-12 h-10 md:h-11 lg:h-12 flex items-center justify-center font-bold relative focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 rounded-full hover:bg-background transition-colors text-text",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-sm",
            day_today: "text-primary border border-primary/20",
            day_outside: "text-text-muted/30 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          }}
        />
      </div>

      {/* Right: Today's Schedule List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
            {date ? format(date, "MMM d (EEEE)", { locale: ko }) : "TODAY"}
          </p>
          <h3 className="text-xl font-headings font-bold text-text">
            오늘의 주요 일정
          </h3>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {MOCK_SCHEDULES.map((schedule) => (
            <div 
              key={schedule.id}
              className="flex items-stretch rounded-xl bg-background/50 overflow-hidden group hover:bg-surface hover:shadow-sm border border-transparent hover:border-background/80 transition-all"
            >
              {/* Colored Line Indicator */}
              <div className={cn("w-1.5 shrink-0 rounded-l-xl", schedule.color)} />
              
              <div className="flex-1 p-4 pl-5 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-0.5">
                  <span className="font-headings text-lg font-black text-text w-14 shrink-0">
                    {schedule.time}
                  </span>
                  <h4 className="font-headings text-base font-bold text-text leading-tight truncate">
                    {schedule.title}
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-14 shrink-0" />
                  <p className="text-sm font-medium text-text-muted truncate">
                    {schedule.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
