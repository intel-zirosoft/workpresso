"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSave?: (data: { title: string; startTime: string; endTime: string }) => void;
  isPending?: boolean;
  initialData?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  } | null;
}

export function ScheduleModal({ 
  open, 
  onOpenChange, 
  selectedDate, 
  onSave, 
  isPending = false,
  initialData = null 
}: ScheduleModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setStartTime(new Date(initialData.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        setEndTime(new Date(initialData.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setTitle("");
        setStartTime("09:00");
        setEndTime("10:00");
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleSave = () => {
    if (!title.trim() || isPending) return;
    
    // 시간 유효성 검사
    if (startTime >= endTime) {
      setError("잘못된 시간 설정 입니다.");
      return;
    }

    setError(null);
    onSave?.({ title, startTime, endTime });
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 bg-surface shadow-float border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-headings font-bold text-text">
            {initialData ? "일정 수정" : "일정 추가"}
          </DialogTitle>
          <DialogDescription className="text-muted font-body">
            {initialData 
              ? "일정의 내용을 수정합니다." 
              : (selectedDate ? `${selectedDate.toLocaleDateString('ko-KR')}의 새로운 일정을 등록합니다.` : "새로운 일정을 등록합니다.")
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-headings font-semibold text-text">일정 제목</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주간 회의" 
              className="rounded-xl border-background shadow-none focus-visible:ring-primary h-12"
              disabled={isPending}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-headings font-semibold text-text">시작 시간</label>
              <Input 
                type="time" 
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setError(null);
                }}
                className="rounded-xl border-background shadow-none focus-visible:ring-primary h-12"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-headings font-semibold text-text">종료 시간</label>
              <Input 
                type="time" 
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setError(null);
                }}
                className="rounded-xl border-background shadow-none focus-visible:ring-primary h-12"
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-headings font-semibold text-red-500 animate-pulse ml-1">
              {error}
            </p>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isPending}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 rounded-pill h-11 px-6 font-headings"
          >
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || isPending}
            className="bg-primary text-white rounded-pill h-11 px-6 font-headings shadow-soft hover:shadow-float transition-all"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
