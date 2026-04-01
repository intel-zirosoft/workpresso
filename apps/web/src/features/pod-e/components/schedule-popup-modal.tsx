"use client";

import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, ArrowRight, Users } from "lucide-react";
import { useSchedule } from "@/features/pod-e/contexts/schedule-context";
import {
  fetchSchedules,
  type Schedule,
} from "@/app/(schedules)/_components/schedule-api";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  TASK: { label: "업무", color: "bg-primary", icon: Clock },
  MEETING: { label: "회의", color: "bg-warning", icon: Users },
  VACATION: { label: "휴가", color: "bg-destructive", icon: Clock },
  HALF_DAY: { label: "반차", color: "bg-destructive/70", icon: Clock },
  WFH: { label: "재택", color: "bg-info", icon: Clock },
  OUTSIDE: { label: "외근", color: "bg-success", icon: Clock },
};

export function SchedulePopupModal() {
  const { isOpen, closeSchedule } = useSchedule();
  const router = useRouter();
  const pathname = usePathname();

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
    enabled: isOpen,
  });

  const today = new Date();
  
  const todaySchedules = schedules
    .filter((schedule) => isSameDay(new Date(schedule.start_time), today))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const handleClose = () => {
    closeSchedule();
    if (pathname !== "/schedules") {
      router.push("/schedules");
    }
  };

  const handleViewAll = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-background/60 bg-surface shadow-2xl rounded-[28px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 font-headings text-2xl font-bold text-text">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </span>
            오늘의 일정
          </DialogTitle>
          <p className="text-sm font-medium text-text-muted mt-1">
            {format(today, "M월 d일 (EEEE)", { locale: ko })}
          </p>
        </DialogHeader>

        <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 py-2 scrollbar-hide">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center text-text-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : todaySchedules.length > 0 ? (
            todaySchedules.map((schedule) => {
              const config = TYPE_CONFIG[schedule.type || "TASK"] || TYPE_CONFIG.TASK;
              const Icon = config.icon;
              
              return (
                <div
                  key={schedule.id}
                  className="flex items-start gap-3 rounded-2xl bg-background/50 p-4 border border-background hover:bg-surface transition-colors"
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background ${config.color} text-white shadow-sm`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headings text-sm font-bold text-text truncate">
                        {schedule.title}
                      </h4>
                    </div>
                    <div className="mt-1 flex items-center text-xs font-medium text-text-muted gap-2">
                       <Clock className="h-3 w-3" />
                       {format(new Date(schedule.start_time), "HH:mm")} - {format(new Date(schedule.end_time), "HH:mm")}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-[150px] flex-col items-center justify-center gap-2 rounded-2xl bg-background/30 border border-dashed border-background/50">
              <Calendar className="h-8 w-8 text-text-muted/50" />
              <p className="text-sm font-medium text-text-muted">오늘 예정된 일정이 없습니다.</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-background/50">
          <Button
            onClick={handleViewAll}
            className="w-full rounded-pill h-12 font-headings font-bold text-base shadow-soft"
          >
            일정 전체 보기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
