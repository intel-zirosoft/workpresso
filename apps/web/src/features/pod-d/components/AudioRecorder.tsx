"use client";

import React, { useState } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { uploadAudio } from "../services/audioStorage";
import {
  createMeetingLog,
  updateMeetingLogSTT,
} from "../services/meetingLogService";
import { refineMeetingLogServer } from "../services/meetingLogAction";
import { transcribeAudio } from "../services/sttService";
import { indexKnowledge } from "../../pod-c/services/knowledgeService";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onComplete?: () => void;
}

type ProcessingStep =
  | "IDLE"
  | "UPLOADING"
  | "TRANSCRIBING"
  | "REFINING"
  | "INDEXING"
  | "COMPLETED";

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("IDLE");
  const [isCompleted, setIsCompleted] = useState(false);
  const supabase = createClient();

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
    audioBlob,
    clearRecording,
  } = useAudioRecording();

  const handleUpload = async () => {
    if (!audioBlob) return;

    try {
      setIsProcessing(true);

      // 0. Get Current User Session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const userId = user?.id;

      if (!userId) {
        throw new Error(
          "로그인이 필요합니다. 실제 회의록을 저장하려면 로그인해 주세요.",
        );
      }

      const currentUserId = userId;

      let text = "";
      let filePath = "";

      if (audioBlob) {
        // 1. Storage Upload
        setProcessingStep("UPLOADING");
        const fileName = `${currentUserId}/meeting_${Date.now()}.wav`;
        filePath = await uploadAudio(audioBlob, fileName);

        // 2. STT Transcription
        setProcessingStep("TRANSCRIBING");
        text = await transcribeAudio(audioBlob);

        // 3. DB Insert/Update
        const newLog = await createMeetingLog({
          owner_id: currentUserId,
          audio_url: filePath,
        });
        await updateMeetingLogSTT(newLog.id, text);

        // 4. AI Refinement (Dynamic Config applied via Server Action)
        setProcessingStep("REFINING");
        try {
          await refineMeetingLogServer(newLog.id, text);
        } catch (refineError) {
          console.error("AI 변환 실패 (무시하고 진행):", refineError);
          // 변환이 실패하더라도 원본 STT는 저장되었으므로 진행합니다.
        }

        // 5. Integration (Pod C): Index Knowledge
        setProcessingStep("INDEXING");
        await indexKnowledge(newLog.id, "MEETING_LOGS", text);
      }

      setProcessingStep("COMPLETED");
      setIsCompleted(true);
      onComplete?.();
    } catch (error: any) {
      console.error("Failed to process meeting log:", error);
      setProcessingStep("IDLE");
      // 서버 로그 파일에 기록
      logger.error("Meeting processing failed", {
        error: error.message || error,
        stack: error.stack,
        status,
        hasAudioBlob: !!audioBlob,
      });
      alert("처리 중 오류가 발생했습니다. 로그 파일을 확인해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isIdle = (status === "idle" || status === "stopped") && !isProcessing;

  if (isCompleted) {
    return (
      <Card className="p-10 bg-white shadow-soft border border-background/50 rounded-3xl flex flex-col items-center gap-6 max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-success/10 p-4 rounded-2xl mb-2">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-headings font-bold text-text">처리 완료!</h3>
          <p className="text-sm text-muted font-medium leading-relaxed">
            회의록이 성공적으로 저장되고<br />
            AI 변환 및 지식 인덱싱이 완료되었습니다.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCompleted(false);
            clearRecording();
          }}
          className="mt-4 rounded-pill px-8 h-12 bg-primary text-white shadow-md hover:shadow-lg transition-all font-bold"
        >
          새 녹음 시작
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-10 bg-white shadow-soft border border-background/50 rounded-3xl flex flex-col items-center gap-8 max-w-md mx-auto relative overflow-hidden">
      {isRecording && (
        <div className="absolute inset-0 bg-primary/3 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex flex-col items-center gap-2 text-center relative z-10">
        <h3 className="text-2xl font-headings font-bold text-text tracking-tight">
          회의록 녹음
        </h3>
        <p className="text-sm font-medium text-muted">
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              {processingStep === "UPLOADING" && "파일 업로드 중..."}
              {processingStep === "TRANSCRIBING" && "음성 분석 중(STT)..."}
              {processingStep === "REFINING" && "AI 회의록 변환 중..."}
              {processingStep === "INDEXING" && "지식 저장 중..."}
            </span>
          ) : isRecording ? (
            <span className="flex items-center gap-2 text-primary font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              녹음 진행 중...
            </span>
          ) : isPaused ? (
            "녹음 일시 정지됨"
          ) : (
            "녹음 준비 완료"
          )}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 relative z-10 mt-2">
        {isIdle && !audioBlob && (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Button
              onClick={startRecording}
              className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
            >
              <Mic className="w-10 h-10 text-white" />
            </Button>
          </div>
        )}

        {isRecording && (
          <>
            <Button
              onClick={pauseRecording}
              className="rounded-full w-14 h-14 shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
            >
              <Pause className="w-6 h-6" />
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/30 rounded-full animate-ping opacity-30" />
              <Button
                onClick={stopRecording}
                className="rounded-full w-20 h-20 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30 relative z-10 transition-all hover:scale-105"
              >
                <Square className="w-10 h-10 text-white fill-white" />
              </Button>
            </div>
          </>
        )}

        {isPaused && (
          <>
            <Button
              onClick={resumeRecording}
              className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-md transition-all"
            >
              <Play className="w-6 h-6 text-white fill-white" />
            </Button>
            <Button
              onClick={stopRecording}
              className="rounded-full w-20 h-20 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30 transition-all hover:scale-105"
            >
              <Square className="w-10 h-10 text-white fill-white" />
            </Button>
          </>
        )}

        {isProcessing && (
          <div className="p-6 bg-primary/5 rounded-full">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}
      </div>

      {audioBlob && mediaBlobUrl && !isProcessing && (
        <div className="w-full flex flex-col gap-4 mt-4 p-5 bg-background/50 rounded-2xl border border-background animate-in slide-in-from-top-2 duration-300">
          <audio src={mediaBlobUrl} controls className="w-full h-10 mix-blend-multiply opacity-80" />
          <div className="flex justify-between items-center gap-3">
            <Button
              variant="ghost"
              onClick={clearRecording}
              className="text-muted hover:text-destructive gap-2 h-10 rounded-pill hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </Button>
            <Button
              onClick={() => handleUpload()}
              className="bg-primary hover:bg-primary/90 rounded-pill h-10 px-8 text-white font-bold shadow-soft transition-all active:scale-95"
            >
              회의록 저장 시작
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
