"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSave?: (data: { title: string; startTime: string; endTime: string }) => void;
}

export function ScheduleModal({ open, onOpenChange, selectedDate, onSave }: ScheduleModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave?.({ title, startTime, endTime });
    onOpenChange(false);
    setTitle("");
    setStartTime("09:00");
    setEndTime("10:00");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 bg-surface shadow-float border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-headings font-bold text-text">일정 추가</DialogTitle>
          <DialogDescription className="text-muted font-body">
            {selectedDate ? `${selectedDate.toLocaleDateString('ko-KR')}의 새로운 일정을 등록합니다.` : "새로운 일정을 등록합니다."}
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
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-headings font-semibold text-text">시작 시간</label>
              <Input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-xl border-background shadow-none focus-visible:ring-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-headings font-semibold text-text">종료 시간</label>
              <Input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-xl border-background shadow-none focus-visible:ring-primary h-12"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 rounded-pill h-11 px-6 font-headings">
            취소
          </Button>
          <Button onClick={handleSave} className="bg-primary text-white rounded-pill h-11 px-6 font-headings shadow-soft hover:shadow-float transition-all">
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
