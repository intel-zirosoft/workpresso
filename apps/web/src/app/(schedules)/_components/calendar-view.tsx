"use client";
import { useEffect, useRef, useState } from "react";
import { format, isSameDay, parse, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Clock, Trash2, Loader2, Pencil, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { ScheduleModal } from "./schedule-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@/styles/calendar.css";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  type Schedule,
  type ScheduleInput,
  ScheduleApiError,
  updateSchedule,
} from "./schedule-api";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
  {
    TASK: { label: "업무", color: "bg-primary", icon: Clock },
    MEETING: { label: "회의", color: "bg-warning", icon: Users },
    VACATION: { label: "휴가", color: "bg-destructive", icon: Clock },
    HALF_DAY: { label: "반차", color: "bg-destructive/70", icon: Clock },
    WFH: { label: "재택", color: "bg-info", icon: Clock },
    OUTSIDE: { label: "외근", color: "bg-success", icon: Clock },
  };

function getErrorMessage(error: unknown) {
  if (error instanceof ScheduleApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

function getTypeConfig(type?: string) {
  if (type && type in TYPE_CONFIG) {
    return TYPE_CONFIG[type];
  }

  return TYPE_CONFIG.TASK;
}

function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}

export function CalendarView({
  variant = "default",
}: {
  variant?: "default" | "full";
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");

  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  // 일정 목록 가져오기 (GET)
  const {
    data: schedules = [],
    isLoading,
    error: schedulesError,
  } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: (createdSchedule) => {
      queryClient.setQueryData<Schedule[]>(["schedules"], (current = []) =>
        sortSchedules([...current, createdSchedule]),
      );
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleInput> }) =>
      updateSchedule(id, data),
    onSuccess: (updatedSchedule) => {
      queryClient.setQueryData<Schedule[]>(["schedules"], (current = []) =>
        sortSchedules(
          current.map((schedule) =>
            schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
          ),
        ),
      );
      setIsModalOpen(false);
      setEditingSchedule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Schedule[]>(["schedules"], (current = []) =>
        current.filter((schedule) => schedule.id !== deletedId),
      );
    },
  });

  const selectedDateSchedules = schedules
    .filter(
      (schedule) => date && isSameDay(new Date(schedule.start_time), date),
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const submitErrorMessage =
    getErrorMessage(createMutation.error) ??
    getErrorMessage(updateMutation.error);

  const pageErrorMessage =
    getErrorMessage(schedulesError) ??
    submitErrorMessage ??
    getErrorMessage(deleteMutation.error);

  const handleSaveSchedule = (data: {
    title: string;
    startTime: string;
    endTime: string;
    type: string;
  }) => {
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
          type: data.type,
        },
      });
    } else {
      createMutation.mutate({
        title: data.title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: data.type,
      });
    }
  };

  const handleEdit = (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말로 이 일정을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  // FullCalendar용 이벤트 데이터 변환
  const calendarEvents = schedules.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.start_time,
    end: s.end_time,
    backgroundColor: "transparent",
    borderColor: "transparent",
    extendedProps: { type: s.type || "TASK" },
  }));

  const handleDateClick = (arg: any) => {
    const clickedDate = arg.date;
    setDate(clickedDate);

    // [요청 사항] 클릭한 날짜가 다른 달인 경우 자동으로 해당 달력으로 이동
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentMonth = calendarApi.getDate().getMonth();
      if (clickedDate.getMonth() !== currentMonth) {
        calendarApi.gotoDate(clickedDate);
      }
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const typeConfig = getTypeConfig(eventInfo.event.extendedProps.type);
    return (
      <div className="flex items-center px-1 overflow-hidden">
        <span className={cn("calendar-event-dot", typeConfig.color)} />
        <span className="truncate text-[11px] font-bold text-text opacity-80">
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  // [요청 사항] 금일 날짜를 기준으로 가로 스크롤 맞춤
  const scrollToToday = () => {
    if (variant !== "full") return;

    // querySelector 대신 calendarRef.current를 통해 범위를 좁혀 안전하게 접근합니다.
    const calendarEl = (calendarRef.current as any)?.el;
    if (!calendarEl) return;

    const todayCell = calendarEl.querySelector(".fc-day-today");
    if (todayCell) {
      todayCell.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  // [Full Variant] 대형 달력 렌더링
  if (variant === "full") {
    const calendarApi = calendarRef.current?.getApi();

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Custom Header Toolbar */}
        <div className="flex items-center justify-between mb-5">
          {/* Left space for alignment (Header now handles Title & Description) */}
          <div className="hidden md:block md:w-[190px]" />

          {/* Center: Navigation Controls (< 2026년 3월 >) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => calendarApi?.prev()}
              className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-primary group"
            >
              <ChevronLeft size={28} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
            </button>
            <h2 className="text-2xl font-headings font-bold text-text min-w-[180px] text-center tracking-tight">
              {currentTitle}
            </h2>
            <button
              onClick={() => calendarApi?.next()}
              className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-primary group"
            >
              <ChevronRight size={28} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
            </button>
          </div>

          {/* Right: View Switchers */}
          <div className="flex items-center gap-1 bg-background/50 p-1 rounded-pill border border-background/50">
            <button
              onClick={() => calendarApi?.changeView("dayGridMonth")}
              className={cn(
                "px-6 py-2 rounded-pill font-headings font-bold text-sm transition-all",
                currentView === "dayGridMonth"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-muted hover:text-text"
              )}
            >
              월간
            </button>
            <button
              onClick={() => calendarApi?.changeView("dayGridWeek")}
              className={cn(
                "px-6 py-2 rounded-pill font-headings font-bold text-sm transition-all",
                currentView === "dayGridWeek"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-muted hover:text-text"
              )}
            >
              주간
            </button>
          </div>
        </div>

        <div className="flex-1 bg-surface rounded-[32px] px-6 pt-4 pb-2 shadow-soft border border-background/50 overflow-x-auto custom-scrollbar min-w-0">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            headerToolbar={false}
            events={calendarEvents}
            dateClick={handleDateClick}
            datesSet={(arg) => {
              setCurrentTitle(arg.view.title);
              setCurrentView(arg.view.type);
              requestAnimationFrame(scrollToToday);
            }}
            eventClick={(info) => {
              const schedule = schedules.find((s) => s.id === info.event.id);
              if (schedule)
                handleEdit(schedule, { stopPropagation: () => {} } as any);
            }}
            eventContent={renderEventContent}
            height="100%"
            dayMaxEvents={3}
            selectable={true}
          />
        </div>

        {pageErrorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
            {pageErrorMessage}
          </div>
        ) : null}

        {/* 선택된 날짜의 일정 목록 (하단 또는 측면 보조) */}
        {date && (
          <div className="bg-surface/60 rounded-2xl p-6 border border-dashed border-background/80">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-headings font-bold text-text">
                {format(date, "MM월 dd일 (EEEE)", { locale: ko })}
              </h4>
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-pill bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:shadow-soft transition-all"
              >
                + 새 일정
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full flex min-h-24 items-center justify-center">
                  <Loader2 className="animate-spin text-text-muted" size={24} />
                </div>
              ) : null}
              {!isLoading &&
                selectedDateSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-xl bg-surface border border-background shadow-xs relative overflow-hidden group"
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        getTypeConfig(schedule.type).color,
                      )}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-text-muted font-bold uppercase mb-1">
                          {format(new Date(schedule.start_time), "HH:mm")} -{" "}
                          {format(new Date(schedule.end_time), "HH:mm")}
                        </p>
                        <h5 className="font-bold text-text mb-2">
                          {schedule.title}
                        </h5>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEdit(schedule, e)}
                          className="p-1.5 hover:bg-background rounded-full transition-colors"
                        >
                          <Pencil size={14} className="text-primary/60" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(schedule.id, e)}
                          className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors"
                        >
                          <Trash2 size={14} className="text-destructive/60" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {!isLoading && selectedDateSchedules.length === 0 && (
                <p className="col-span-full text-center py-4 text-text-muted text-sm font-medium italic">
                  해당 날짜에 일정이 없습니다.
                </p>
              )}
            </div>
          </div>
        )}

        <ScheduleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          selectedDate={date}
          onSave={handleSaveSchedule}
          isPending={createMutation.isPending || updateMutation.isPending}
          initialData={editingSchedule}
          submitError={submitErrorMessage}
        />
      </div>
    );
  }

  // [Default Variant] 기존 소형 달력 렌더링 (Home)
  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      <div className="lg:w-1/2 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ko}
          className="rounded-2xl border border-background shadow-soft p-4 bg-surface"
        />
      </div>

      <div className="lg:w-1/2 flex flex-col space-y-4">
        {pageErrorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
            {pageErrorMessage}
          </div>
        ) : null}

        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-headings font-bold text-text">
            {date
              ? format(date, "MM월 dd일 (EEEE)", { locale: ko })
              : "날짜를 선택하세요"}
          </h4>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setIsModalOpen(true);
            }}
            disabled={!date}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-text-muted" size={24} />
            </div>
          ) : selectedDateSchedules.length > 0 ? (
            selectedDateSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-col p-4 rounded-xl bg-surface border border-background shadow-sm hover:shadow-soft transition-shadow relative overflow-hidden group"
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    getTypeConfig(schedule.type).color,
                  )}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary text-sm mb-1">
                    <Clock size={14} className="opacity-70" />
                    <span>
                      {format(new Date(schedule.start_time), "HH:mm")} -{" "}
                      {format(new Date(schedule.end_time), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEdit(schedule, e)}
                      className="p-1.5 hover:bg-background rounded-full"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(schedule.id, e)}
                      className="p-1.5 hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 size={14} className="text-destructive/60" />
                    </button>
                  </div>
                </div>
                <p className="font-bold text-text">{schedule.title}</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted space-y-3 bg-background/30 rounded-2xl border border-dashed border-background/50">
              <p className="text-sm">일정이 없습니다.</p>
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
        submitError={submitErrorMessage}
      />
    </div>
  );
}
