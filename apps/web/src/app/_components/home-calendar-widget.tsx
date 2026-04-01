import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Dummy schedules matching the image exactly
const MOCK_SCHEDULES = [
  {
    id: 1,
    time: "09:00",
    meridiem: "AM",
    title: "제품 전략 싱크",
    desc: "회의실 B • 45분",
    color: "bg-blue-600 dark:bg-blue-400", // Deep blue derived from image
    edge: "bar",
  },
  {
    id: 2,
    time: "11:30",
    meridiem: "AM",
    title: "디자인 리뷰: Curator Pro V2",
    desc: "화상 회의 • 1시간",
    color: "bg-purple-600 dark:bg-purple-400", // Deep purple derived from image
    edge: "bar",
  },
  {
    id: 3,
    time: "02:00",
    meridiem: "PM",
    title: "콘텐츠 큐레이션 워크숍",
    desc: "워크스페이스 허브 • 진행 중",
    color: "bg-slate-500 dark:bg-slate-400", // Light dusty blue derived from image
    edge: "dot",
  },
];

export function HomeCalendarWidget() {
  const date = new Date();

  return (
    <div className="rounded-[32px] border border-background/60 bg-surface shadow-soft p-8 md:p-10 w-full flex flex-col gap-10 min-h-[400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <h3 className="text-[28px] md:text-[32px] font-headings font-bold text-text tracking-tight">
            오늘의 주요 일정
          </h3>
          <p className="text-[15px] font-bold text-text-muted/80">
            {format(date, "M월 d일 EEEE", { locale: ko })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-background/50 hover:bg-background transition-all text-text-muted shadow-sm active:scale-95">
             <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-background/50 hover:bg-background transition-all text-text-muted shadow-sm active:scale-95">
             <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Schedule List (Image 1 Style) */}
      <div className="flex flex-col gap-6">
        {MOCK_SCHEDULES.map((schedule) => (
          <div key={schedule.id} className="flex items-center gap-6 group">
            {/* Time Label (Outer Left) */}
            <div className="w-[85px] shrink-0 pl-1">
              <span className="text-[13px] font-bold text-text-muted/80 group-hover:text-text transition-colors">
                {schedule.time} {schedule.meridiem}
              </span>
            </div>

            {/* Schedule Card Box */}
            <div className="flex-1 flex items-stretch relative rounded-[18px] bg-background/40 dark:bg-background/20 group-hover:bg-background/60 dark:group-hover:bg-background/40 transition-all h-[80px] md:h-[90px]">
              
              {/* Left Bar Indicator (conditionally rendered) */}
              {schedule.edge === "bar" && (
                <div className={cn("w-1.5 shrink-0 rounded-l-[18px]", schedule.color)} />
              )}
              
              <div className="flex-1 px-6 flex flex-col justify-center relative">
                <h4 className="font-headings text-[16px] md:text-[18px] font-bold text-text leading-tight mb-1 truncate">
                  {schedule.title}
                </h4>
                <p className="text-[13px] font-medium text-text-muted/70 truncate">
                  {schedule.desc}
                </p>

                {/* Right Dot Indicator (conditionally rendered) */}
                {schedule.edge === "dot" && (
                  <div className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full", schedule.color)} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
