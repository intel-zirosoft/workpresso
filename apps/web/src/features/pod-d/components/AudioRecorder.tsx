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
  refineMeetingLog,
} from "../services/meetingLogService";
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

        // 4. AI Refinement
        setProcessingStep("REFINING");
        try {
          await refineMeetingLog(newLog.id, text);
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
      <Card className="p-8 bg-surface shadow-soft border-none rounded-md flex flex-col items-center gap-4 max-w-md mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-success" />
        <h3 className="text-xl font-headings font-bold">처리 완료!</h3>
        <p className="text-muted font-body">
          회의록이 성공적으로 저장되고 STT 변환 및 지식 인덱싱이 완료되었습니다.
        </p>
        <Button
          onClick={() => {
            setIsCompleted(false);
            clearRecording();
          }}
          className="mt-4 rounded-full px-8"
        >
          새 녹음 시작
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-surface shadow-soft border-none rounded-md flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-xl font-headings font-semibold text-foreground">
          회의록 녹음
        </h3>
        <p className="text-sm text-muted font-body">
          {isProcessing ? (
            <span className="flex items-center gap-1">
              {processingStep === "UPLOADING" && "파일 업로드 중..."}
              {processingStep === "TRANSCRIBING" && "음성 분석 중(STT)..."}
              {processingStep === "REFINING" && "AI 회의록 변환 중..."}
              {processingStep === "INDEXING" && "지식 저장 및 인덱싱 중..."}
            </span>
          ) : isRecording ? (
            "녹음 중..."
          ) : isPaused ? (
            "일시 정지됨"
          ) : (
            "녹음 준비 완료"
          )}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isIdle && !audioBlob && (
          <Button
            onClick={startRecording}
            className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-soft"
          >
            <Mic className="w-8 h-8 text-white" />
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              onClick={pauseRecording}
              className="rounded-full w-12 h-12 shadow-soft bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <Pause className="w-6 h-6" />
            </Button>
            <Button
              onClick={stopRecording}
              className="rounded-full w-16 h-16 bg-destructive hover:bg-destructive/90 shadow-soft"
            >
              <Square className="w-8 h-8 text-white" />
            </Button>
          </>
        )}

        {isPaused && (
          <>
            <Button
              onClick={resumeRecording}
              className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-soft"
            >
              <Play className="w-6 h-6 text-white" />
            </Button>
            <Button
              onClick={stopRecording}
              className="rounded-full w-16 h-16 bg-destructive hover:bg-destructive/90 shadow-soft"
            >
              <Square className="w-8 h-8 text-white" />
            </Button>
          </>
        )}

        {isProcessing && (
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        )}
      </div>

      {audioBlob && mediaBlobUrl && !isProcessing && (
        <div className="w-full flex flex-col gap-4 mt-4 p-4 bg-background rounded-sm">
          <audio src={mediaBlobUrl} controls className="w-full h-10" />
          <div className="flex justify-between items-center">
            <Button
              onClick={clearRecording}
              className="text-muted hover:text-destructive gap-2 bg-transparent hover:bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </Button>
            <Button
              onClick={() => handleUpload()}
              className="bg-success hover:bg-success/90 rounded-pill px-6 text-white"
            >
              업로드 및 변환
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
