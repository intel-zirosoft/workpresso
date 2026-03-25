"use client";

import { useState } from "react";
import { format, isSameDay, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Clock, Trash2, Loader2, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ScheduleModal } from "./schedule-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const queryClient = useQueryClient();

  // 일정 목록 가져오기 (GET)
  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await fetch("/api/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return res.json();
    },
  });

  // 일정 생성하기 (POST)
  const createMutation = useMutation({
    mutationFn: async (newSchedule: Omit<Schedule, "id">) => {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedule),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.[0]?.message || "Failed to create schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsModalOpen(false);
    },
  });

  // 일정 수정하기 (PATCH)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsModalOpen(false);
      setEditingSchedule(null);
    },
  });

  // 일정 삭제하기 (DELETE)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  // 선택된 날짜에 해당하는 일정만 필터링
  const selectedDateSchedules = schedules
    .filter((schedule) => date && isSameDay(new Date(schedule.start_time), date))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const handleSaveSchedule = (data: { title: string; startTime: string; endTime: string }) => {
    if (!date) return;
    
    const startDateTime = parse(data.startTime, "HH:mm", date);
    const endDateTime = parse(data.endTime, "HH:mm", date);
    
    if (editingSchedule) {
      updateMutation.mutate({
        id: editingSchedule.id,
        data: {
          title: data.title,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        },
      });
    } else {
      createMutation.mutate({
        title: data.title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });
    }
  };

  const handleEdit = (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말로 이 일정을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
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
            onClick={handleAddClick}
            disabled={!date || createMutation.isPending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40 text-muted">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : selectedDateSchedules.length > 0 ? (
            selectedDateSchedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="flex flex-col p-4 rounded-xl bg-white border border-background shadow-sm hover:shadow-soft mb-2 transition-shadow relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-headings font-medium text-sm mb-1">
                    <Clock size={14} className="opacity-70" />
                    <span>
                      {format(new Date(schedule.start_time), "HH:mm")} - {format(new Date(schedule.end_time), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleEdit(schedule, e)}
                      className="p-2 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(schedule.id, e)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                disabled={!date}
                className="text-primary text-sm font-headings font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingSchedule}
      />
    </div>
  );
}

