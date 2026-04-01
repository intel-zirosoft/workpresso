"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { format, isSameDay, parse, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Clock, Trash2, Loader2, Pencil, Users, ChevronLeft, ChevronRight, Mic, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleModal } from "./schedule-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  type Schedule,
  type ScheduleInput,
  ScheduleApiError,
  updateSchedule,
} from "./schedule-api";

const FullCalendarClient = dynamic(
  () =>
    import("./full-calendar-client").then((module) => module.FullCalendarClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-background/60 bg-background/20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    ),
  },
);

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
  const [viewingVoice, setViewingVoice] = useState<Schedule | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const queryClient = useQueryClient();
  const calendarRef = useRef<any>(null);

  // 일정 목록 가져오기 (GET)
  const {
    data: schedules = [],
    isLoading,
    error: schedulesError,
  } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });

  // [v1.0] 외부(AI Chat 등)에서 일정을 생성했을 때 실시간 UI 갱신을 위한 리스너
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    };

    window.addEventListener("workpresso:refresh-schedules", handleRefresh);
    return () => window.removeEventListener("workpresso:refresh-schedules", handleRefresh);
  }, [queryClient]);

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
    mutationFn: async (idOrIds: string | string[]) => {
      const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).filter(Boolean);
      console.log("Attempting to delete IDs:", ids);
      if (ids.length === 0) return Promise.resolve();
      return Promise.all(ids.map((id) => deleteSchedule(id)));
    },
    onSuccess: (_, idOrIds) => {
      const idsToDelete = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).filter(Boolean);
      queryClient.setQueryData<Schedule[]>(["schedules"], (current = []) =>
        current.filter((schedule) => !idsToDelete.includes(schedule.id)),
      );
    },
    onError: (err) => {
      console.error("Delete mutation failed:", err);
      alert(err instanceof Error ? err.message : "일정 삭제 중 오류가 발생했습니다.");
    }
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
    description?: string;
  }) => {
    if (!date) return;
    const startDateTime = parse(data.startTime, "HH:mm", date);
    const endDateTime = parse(data.endTime, "HH:mm", date);

    const metadata = data.description
      ? [{ sub_id: `manual_${Date.now()}`, content: data.description, tags: ["수동 입력"] }]
      : [];

    if (editingSchedule) {
      updateMutation.mutate({
        id: editingSchedule.id,
        data: {
          title: data.title,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          type: data.type,
          metadata,
        },
      });
    } else {
      createMutation.mutate({
        title: data.title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: data.type,
        has_voice: false,
        metadata,
      } as any);
    }
  };

  const handleEdit = (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDelete = (idOrIds: string | string[], e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 유효한 ID만 추출
    const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).filter(Boolean);
    if (ids.length === 0) {
      console.warn("handleDelete called with no valid IDs");
      return;
    }

    const isMultiple = ids.length > 1;
    const message = isMultiple 
      ? `연동된 ${ids.length}개의 세션 데이터를 모두 삭제하시겠습니까?`
      : "정말로 이 일정을 삭제하시겠습니까?";

    if (confirm(message)) {
      console.log("User confirmed deletion of:", ids);
      deleteMutation.mutate(ids);
    }
  };

  const handleUpdateMetadata = (scheduleId: string, subId: string, newContent: string) => {
    const parentSchedule = schedules.find(s => s.id === scheduleId);
    if (!parentSchedule || !parentSchedule.metadata) return;

    const newMetadata = parentSchedule.metadata.map((item: any) => 
      item.sub_id === subId ? { ...item, content: newContent } : item
    );

    updateMutation.mutate({
      id: scheduleId,
      data: { metadata: newMetadata }
    });
    setEditingItemId(null);
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
    const hasVoice = eventInfo.event.extendedProps.has_voice;
    
    return (
      <div className="flex items-center px-1 overflow-hidden">
        <span className={cn("calendar-event-dot", typeConfig.color)} />
        <span className="truncate text-[11px] font-bold text-text opacity-80 flex items-center gap-0.5">
          {hasVoice && <span className="text-[10px]">🎙️</span>}
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
    return (
      <div className="flex flex-col gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        <div className="flex-1 bg-surface rounded-3xl p-6 shadow-soft border border-background/50 overflow-x-auto custom-scrollbar min-w-0">
          <FullCalendarClient
            calendarRef={calendarRef}
            events={calendarEvents}
            onDateClick={handleDateClick}
            onDatesSet={(arg: any) => {
              setCurrentTitle(arg.view.title);
              setCurrentView(arg.view.type);
              requestAnimationFrame(scrollToToday);
            }}
            onEventClick={(info: any) => {
              const schedule = schedules.find((s) => s.id === info.event.id);
              if (schedule) {
                if (schedule.title.includes("\n---\n")) {
                  setViewingVoice(schedule);
                } else {
                  handleEdit(schedule, { stopPropagation: () => {} } as any);
                }
              }
            }}
            renderEventContent={renderEventContent}
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

            <div className="flex flex-col gap-8">
              {isLoading ? (
                <div className="col-span-full flex min-h-24 items-center justify-center">
                  <Loader2 className="animate-spin text-text-muted" size={24} />
                </div>
              ) : selectedDateSchedules.length > 0 ? (
                // [v1.0] 세션 단위 그룹화 (제목 + 시간)
                Object.values(
                  selectedDateSchedules.reduce((acc: any, s) => {
                    const key = `${s.title}-${s.start_time}-${s.end_time}`;
                    if (!acc[key]) {
                      acc[key] = { ...s, ids: [s.id], items: s.metadata || [] };
                    } else {
                      // 중복된 세션일 경우 ID만 추가 (v1.0 일괄삭제용)
                      acc[key].ids.push(s.id);
                      // 메타데이터가 있다면 합치기
                      if (s.metadata) {
                        acc[key].items = [...acc[key].items, ...s.metadata];
                      }
                    }
                    return acc;
                  }, {})
                ).map((session: any) => (
                  <div key={session.id} className="space-y-4">
                    {/* 상위 항목: 회의 제목 및 시간 */}
                    <div className="flex items-center justify-between border-b border-background pb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-6 rounded-full", getTypeConfig(session.type).color)} />
                        <h5 
                          onClick={() => setViewingVoice(session)}
                          className="text-lg font-headings font-bold text-text flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group/title"
                        >
                          {session.has_voice && <Mic size={18} className="text-primary group-hover/title:scale-110 transition-transform" />}
                          {session.title}
                        </h5>
                        <span className="text-sm font-medium text-text-muted bg-background/50 px-2 py-0.5 rounded-md">
                          {format(new Date(session.start_time), "HH:mm")} - {format(new Date(session.end_time), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleEdit(session, e)}
                          className="p-2 hover:bg-background rounded-full transition-colors text-primary/60"
                          title="세션 수정"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.ids, e)}
                          className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-destructive/60"
                          title="전체 세션 삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 하위 항목 (Card): 상세 안건 및 AI 요약본 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                      {session.items && session.items.length > 0 ? (
                        session.items.map((item: any, idx: number) => {
                          const isEditing = editingItemId === item.sub_id;

                          return (
                            <div
                              key={item.sub_id || idx}
                              onClick={() => !isEditing && setViewingVoice(session)}
                              className={cn(
                                "p-4 rounded-xl border transition-all relative group",
                                isEditing 
                                  ? "bg-surface border-primary shadow-float ring-2 ring-primary/10" 
                                  : "bg-surface border-background shadow-sm hover:shadow-soft cursor-pointer"
                              )}
                            >
                              {/* [v1.1] 개별 카드 수정/삭제 액션 */}
                              {!isEditing && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingItemId(item.sub_id);
                                      setEditContent(item.content);
                                    }}
                                    className="p-1.5 hover:bg-primary/10 rounded-lg text-primary/60 hover:text-primary transition-colors"
                                    title="안건 수정"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                </div>
                              )}

                              {isEditing ? (
                                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {(item.tags || ["AGENDA"]).map((tag: string) => (
                                      <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full min-h-[80px] bg-background/50 rounded-lg border-none p-2 text-sm focus:ring-1 focus:ring-primary font-body resize-none"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingItemId(null)}
                                      className="p-1.5 hover:bg-background rounded-lg text-text-muted"
                                    >
                                      <X size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateMetadata(session.id, item.sub_id, editContent)}
                                      className="p-1.5 bg-primary text-primary-foreground rounded-lg shadow-sm"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {session.has_voice && (
                                    <div className="absolute top-3 right-3 opacity-20">
                                      <Mic size={14} className="text-primary" />
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {item.tags?.map((tag: string) => (
                                      <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 uppercase tracking-tighter">
                                        {tag}
                                      </span>
                                    )) || <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-background text-text-muted uppercase tracking-tighter">AGENDA</span>}
                                  </div>
                                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3 break-keep">
                                    {item.content}
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-background/60 text-xs text-text-muted italic">
                          상세 안건이 등록되지 않았습니다.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center py-12 text-text-muted text-sm font-medium italic bg-background/20 rounded-3xl border border-dashed border-background/50">
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
            selectedDateSchedules.map((schedule) => {
              const summaryItem = schedule.metadata?.[0];
              const displayTitle = schedule.title;
              const hasVoice = schedule.has_voice;

              return (
                <div
                  key={schedule.id}
                  onClick={() => {
                    if (hasVoice) setViewingVoice(schedule);
                    else {
                      setEditingSchedule(schedule);
                      setIsModalOpen(true);
                    }
                  }}
                  className="flex flex-col p-4 rounded-xl bg-surface border border-background shadow-sm hover:shadow-soft transition-shadow relative overflow-hidden group cursor-pointer"
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      getTypeConfig(schedule.type).color,
                    )}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary text-sm">
                      {hasVoice ? <Mic size={14} /> : <Clock size={14} className="opacity-70" />}
                      <span>
                        {format(new Date(schedule.start_time), "HH:mm")} -{" "}
                        {format(new Date(schedule.end_time), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!hasVoice && (
                        <button
                          onClick={(e) => handleEdit(schedule, e)}
                          className="p-1.5 hover:bg-background rounded-full"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(schedule.id, e)}
                        className="p-1.5 hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 size={14} className="text-destructive/60" />
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-text truncate">
                    {hasVoice && <span className="mr-1 text-xs">🎙️</span>}
                    {displayTitle}
                  </p>
                  {summaryItem?.content && (
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {summaryItem.content}
                    </p>
                  )}
                </div>
              );
            })
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

      <Dialog open={!!viewingVoice} onOpenChange={(open) => !open && setViewingVoice(null)}>
        <DialogContent className="sm:max-w-md border-background/60 bg-surface shadow-2xl rounded-[28px] p-6 lg:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 font-headings text-xl sm:text-2xl font-bold text-text mb-2 text-left">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="leading-tight flex-1">
                {viewingVoice?.title || "회의 상세 내용"}
              </span>
            </DialogTitle>
            {viewingVoice && (
              <div className="flex items-center gap-2 text-sm font-medium text-text-muted mt-2 ml-[52px]">
                <Clock size={14} />
                {format(new Date(viewingVoice.start_time), "yyyy년 M월 d일 (EEEE) HH:mm", { locale: ko })}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 leading-relaxed text-sm text-text-muted">
            {viewingVoice?.metadata && viewingVoice.metadata.length > 0 ? (
              viewingVoice.metadata.map((item, idx) => (
                <div key={idx} className="bg-background/40 rounded-2xl p-4 border border-dashed border-background/60">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags?.map((tag: string) => (
                      <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80 uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="whitespace-pre-wrap break-keep">
                    {item.content}
                  </div>
                </div>
              ))
            ) : viewingVoice?.title.includes("\n---\n") ? (
              // [v1.0] 구버전 데이터 호환 (구분자 기반)
              <div className="bg-background/40 rounded-2xl p-5 border border-dashed border-background/60 whitespace-pre-wrap break-keep">
                {viewingVoice.title.split("\n---\n")[1]}
              </div>
            ) : (
              <div className="text-sm text-text-muted italic py-10 text-center bg-background/20 rounded-2xl border border-dashed border-background/40">
                상세 요약 내용이 등록되지 않았습니다.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
