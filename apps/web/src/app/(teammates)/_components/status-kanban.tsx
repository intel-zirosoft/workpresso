"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, User, MoreHorizontal, UserCircle, Briefcase, MapPin, Calendar, Clock, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

type UserStatus = 'ACTIVE' | 'VACATION' | 'MEETING' | 'OFFLINE' | 'REMOTE' | 'OUTSIDE' | 'HALF_DAY';

interface Teammate {
  id: string;
  name: string;
  department: string | null;
  status: UserStatus;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  '디자인': 'text-rose-500 bg-rose-50',
  '개발': 'text-blue-500 bg-blue-50',
  '기획': 'text-amber-500 bg-amber-50',
  '경영': 'text-emerald-500 bg-emerald-50',
};

const STATUS_COLUMNS: { id: UserStatus; label: string; color: string; dot: string }[] = [
  { id: 'ACTIVE', label: '업무 중', color: 'bg-primary/5', dot: 'bg-primary' },
  { id: 'MEETING', label: '회의 중', color: 'bg-amber-50', dot: 'bg-amber-400' },
  { id: 'REMOTE', label: '재택 근무', color: 'bg-blue-50', dot: 'bg-blue-400' },
  { id: 'OUTSIDE', label: '외근 중', color: 'bg-emerald-50', dot: 'bg-emerald-400' },
  { id: 'VACATION', label: '휴가/반차', color: 'bg-rose-50', dot: 'bg-rose-400' },
  { id: 'OFFLINE', label: '부재 중', color: 'bg-slate-50', dot: 'bg-slate-300' },
];

export function StatusKanban() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // 현재 사용자 정보 가져오기 (권한 및 드래그 제어용)
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/users/me"); // 새로 만들 엔드포인트
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    };
    fetchUser();
  }, []);

  // 사용자 목록 가져오기
  const { data: teammates = [], isLoading } = useQuery<Teammate[]>({
    queryKey: ["teammates"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch teammates");
      return res.json();
    },
  });

  // 상태 업데이트
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: UserStatus }) => {
      const res = await fetch("/api/users/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teammates"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, teammateId: string) => {
    if (teammateId !== currentUser?.id) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("teammateId", teammateId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: UserStatus) => {
    e.preventDefault();
    const teammateId = e.dataTransfer.getData("teammateId");
    if (teammateId === currentUser?.id) {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-muted font-headings animate-pulse">팀 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
      {STATUS_COLUMNS.map((column) => (
        <div 
          key={column.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
          className={cn(
            "flex-shrink-0 w-[280px] flex flex-col h-full rounded-2xl border transition-colors",
            column.color,
            "border-background/40"
          )}
        >
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", column.dot)} />
              <h3 className="font-headings font-bold text-text text-sm">{column.label}</h3>
              <span className="bg-white/60 text-[10px] px-2 py-0.5 rounded-full text-muted font-bold ml-1 border border-background/20">
                {teammates.filter(t => t.status === column.id).length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-3 pb-4">
            {teammates.filter(t => t.status === column.id).map((teammate) => {
              const isMe = teammate.id === currentUser?.id;
              return (
                <div 
                  key={teammate.id}
                  draggable={isMe}
                  onDragStart={(e) => handleDragStart(e, teammate.id)}
                  className={cn(
                    "bg-white p-4 rounded-xl shadow-sm border transition-all relative group",
                    isMe ? "border-primary/30 ring-2 ring-primary/5 cursor-grab active:cursor-grabbing hover:shadow-soft" : "border-background/30 opacity-90"
                  )}
                >
                  {isMe && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-full">
                      <Smile size={10} className="text-primary" />
                      <span className="text-[8px] font-bold text-primary italic">ME</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-white flex items-center justify-center text-muted transition-colors flex-shrink-0 overflow-hidden border border-background/50 shadow-sm",
                      isMe && "ring-2 ring-primary/20"
                    )}>
                      <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${teammate.name}`} 
                        alt={teammate.name} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-headings font-bold text-sm truncate", isMe ? "text-primary" : "text-text")}>
                        {teammate.name}
                      </p>
                      {teammate.department && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                          DEPARTMENT_COLORS[teammate.department] || "text-muted bg-background"
                        )}>
                          {teammate.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {teammates.filter(t => t.status === column.id).length === 0 && (
              <div className="h-20 border border-dashed border-background/40 rounded-xl flex items-center justify-center">
                <p className="text-[11px] text-muted opacity-50 font-headings">비어 있음</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
