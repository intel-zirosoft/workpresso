"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  CheckSquare,
  Square,
  X,
  History,
  ArrowLeft,
  FileAudio,
  Mic2,
  RefreshCw,
} from "lucide-react";
import {
  listMeetingLogs,
  deleteMeetingLogs,
} from "@/features/pod-d/services/meetingLogService";
import { MeetingLogDetail } from "@/features/pod-d/components/MeetingLogDetail";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AudioRecorderDynamic = dynamic(
  () =>
    import("@/features/pod-d/components/AudioRecorder").then(
      (mod) => mod.AudioRecorder,
    ),
  {
    ssr: false,
  },
);

export default function VoicePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const fetchLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const userId = user.id;
      const data = await listMeetingLogs(userId);

      // Update logs list with real data
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedIds(new Set());
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === logs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map((log) => log.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}개의 기록을 삭제하시겠습니까?`)) return;

    try {
      setLoading(true);
      await deleteMeetingLogs(Array.from(selectedIds));
      await fetchLogs();
      setIsDeleteMode(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to delete logs:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedLog) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          variant="ghost"
          onClick={() => setSelectedLog(null)}
          className="rounded-pill px-4 gap-2 mb-4 hover:bg-surface border border-transparent hover:border-background/50 transition-all font-headings font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 리스트로 돌아가기
        </Button>
        <MeetingLogDetail log={selectedLog} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Recorder Section */}
        <section className="space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Mic2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-headings font-bold text-text tracking-tight">
              새 회의 시작하기
            </h2>
          </div>
          <AudioRecorderDynamic onComplete={fetchLogs} />

          <div className="mt-8 rounded-3xl border border-background/50 bg-surface/70 p-8 text-center shadow-soft animate-in fade-in slide-in-from-top-4 duration-700">
            <p className="text-sm text-text-muted font-medium leading-relaxed">
              회의를 시작하려면 위{" "}
              <span className="text-primary font-bold">마이크 버튼</span>을
              눌러주세요.
              <br />
              변환된 데이터는 자동으로 우측 히스토리에 저장됩니다.
            </p>
          </div>
        </section>

        {/* List Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-headings font-bold text-text tracking-tight">
                최근 회의 기록
              </h2>
            </div>
            {!isDeleteMode ? (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-pill bg-surface/70 hover:bg-surface h-8 px-3 shadow-sm border border-background/50 text-text-muted font-bold text-xs"
                  onClick={fetchLogs}
                  disabled={loading}
                >
                  <RefreshCw
                    className={cn("h-3 w-3 mr-1.5", loading && "animate-spin")}
                  />
                  동기화
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/api/logs", "_blank")}
                  className="rounded-pill h-8 px-4 text-text-muted hover:text-text gap-1.5 shadow-soft hover:shadow-md transition-all text-xs font-bold"
                >
                  로그 확인
                </Button>
                <div className="w-px h-4 bg-background mx-1" />
                <span className="text-sm text-text-muted">
                  {logs.length}개의 기록
                </span>
                {logs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDeleteMode}
                    className="h-8 w-8 p-0 rounded-pill hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs rounded-pill px-3 font-bold"
                >
                  {selectedIds.size === logs.length ? "전체 해제" : "전체 선택"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDeleteMode}
                  className="h-8 w-8 p-0 rounded-pill"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {isDeleteMode && (
            <div className="flex items-center justify-between bg-destructive/5 p-3 rounded-lg border border-destructive/10 animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs font-medium text-destructive">
                {selectedIds.size}개 선택됨
              </span>
              <Button
                size="sm"
                variant="destructive"
                disabled={selectedIds.size === 0}
                onClick={handleBulkDelete}
                className="h-8 px-4 rounded-pill text-xs shadow-soft font-bold"
              >
                선택 삭제 실행
              </Button>
            </div>
          )}

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <p className="text-center py-12 text-text-muted animate-pulse font-body">
                데이터를 불러오는 중...
              </p>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <Card
                  key={log.id}
                  onClick={
                    isDeleteMode
                      ? (e) => toggleSelect(e, log.id)
                      : () => setSelectedLog(log)
                  }
                  className={cn(
                    "p-5 bg-surface hover:bg-surface transition-all cursor-pointer border border-background shadow-soft flex items-center gap-4 group relative rounded-2xl hover:-translate-y-1 hover:shadow-md",
                    isDeleteMode &&
                      selectedIds.has(log.id) &&
                      "ring-2 ring-primary/30 border-primary/20 shadow-md bg-surface",
                  )}
                >
                  {isDeleteMode && (
                    <div className="flex-shrink-0">
                      {selectedIds.has(log.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary animate-in zoom-in-50 duration-200" />
                      ) : (
                        <Square className="w-5 h-5 text-text-muted/30" />
                      )}
                    </div>
                  )}
                  <div className="bg-primary/5 p-3 rounded-md group-hover:bg-primary/10 transition-colors">
                    <FileAudio className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-headings font-bold text-text truncate">
                        {log.title ||
                          `${new Date(log.created_at).toLocaleDateString()} 회의 기록`}
                      </h4>
                      {log.is_refined && (
                        <Badge
                          variant="secondary"
                          className="h-4 text-[10px] px-1.5 bg-success/10 text-success border-none"
                        >
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted truncate font-body">
                      {log.summary ||
                        log.stt_text ||
                        "변환된 텍스트가 없습니다."}
                    </p>
                  </div>
                  <div className="text-xs text-text-muted font-body">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center bg-surface/70 border border-background/50 rounded-3xl shadow-soft animate-in zoom-in-95 duration-500">
                <div className="mb-4 text-text-muted/30">
                  <History className="w-12 h-12 mx-auto opacity-20" />
                </div>
                <p className="text-text-muted font-medium mb-1">
                  아직 저장된 회의록이 없습니다.
                </p>
                <p className="text-xs text-text-muted/60 leading-relaxed px-8">
                  회의를 시작하여 팀의 의견을 한곳에 모으세요.
                </p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
