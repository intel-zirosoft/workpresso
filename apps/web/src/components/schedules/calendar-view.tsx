"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ScheduleModal } from "./schedule-modal";

// 가짜 데이터 (Mock Data)
const MOCK_SCHEDULES = [
  {
    id: "1",
    title: "주간 업무 보고",
    date: new Date(),
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: "2",
    title: "Pod B 팀 회의",
    date: new Date(),
    startTime: "14:00",
    endTime: "15:30",
  },
];

export function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState(MOCK_SCHEDULES);

  const selectedDateSchedules = schedules.filter((schedule) => 
    date && isSameDay(schedule.date, date)
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleSaveSchedule = (data: { title: string; startTime: string; endTime: string }) => {
    if (!date) return;
    
    const newSchedule = {
      id: Math.random().toString(36).substring(7),
      title: data.title,
      date: date,
      startTime: data.startTime,
      endTime: data.endTime,
    };
    
    setSchedules([...schedules, newSchedule]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Calendar Area */}
      <div className="lg:w-1/2 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ko}
          className="rounded-2xl border border-background shadow-soft p-4 bg-surface"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-background text-text",
            head_cell: "text-muted font-headings font-semibold",
          }}
        />
      </div>

      {/* Schedule List Area */}
      <div className="lg:w-1/2 flex flex-col space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-headings font-bold text-text">
            {date ? format(date, "MM월 dd일 (EEEE)", { locale: ko }) : "날짜를 선택하세요"}
          </h4>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
          {selectedDateSchedules.length > 0 ? (
            selectedDateSchedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="flex flex-col p-4 rounded-xl bg-white border border-background shadow-sm hover:shadow-soft mb-2 transition-shadow relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                <div className="flex items-center gap-2 text-primary font-headings font-medium text-sm mb-1">
                  <Clock size={14} className="opacity-70" />
                  <span>{schedule.startTime} - {schedule.endTime}</span>
                </div>
                <p className="font-headings font-bold text-text text-base ml-1">
                  {schedule.title}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted space-y-3 bg-background/30 rounded-2xl border border-dashed border-background/50">
              <p className="font-headings text-sm">일정이 없습니다.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-primary text-sm font-headings font-bold hover:underline"
              >
                + 새 일정 추가하기
              </button>
            </div>
          )}
        </div>
      </div>

      <ScheduleModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        selectedDate={date}
        onSave={handleSaveSchedule}
      />
    </div>
  );
}
