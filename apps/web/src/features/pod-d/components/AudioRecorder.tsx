'use client';

import React, { useState } from 'react';
import { Mic, Square, Pause, Play, Trash2, Loader2, CheckCircle, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { uploadAudio } from '../services/audioStorage';
import { createMeetingLog, updateMeetingLogSTT } from '../services/meetingLogService';
import { transcribeAudio } from '../services/sttService';
import { indexKnowledge } from '../../pod-c/services/knowledgeService';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onComplete?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleUpload = async (isMock: boolean = false) => {
    if (!audioBlob && !isMock) return;

    try {
      setIsProcessing(true);

      // 0. Get Current User Session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // 개발 환경에서는 세션이 없어도 테스트를 위해 진행할 수 있도록 합니다. 수정: 이제 실제 로그인 연동을 위해 더미 아이디를 제거합니다.
      const userId = user?.id;

      if (!userId) {
        throw new Error('로그인이 필요합니다. 실제 회의록을 저장하려면 로그인해 주세요.');
      }

      const currentUserId = userId;
      
      let text = '';
      let filePath = 'mock_audio.wav';

      if (isMock) {
        // Mocking interaction
        await new Promise(resolve => setTimeout(resolve, 1500));
        text = "이것은 테스트용 더미 회의록입니다. 실제로 녹음하지 않고도 전체 프로세스(STT, 지식 인덱싱)가 정상적으로 동작하는지 확인할 수 있습니다.";
        
        // Mock용 로그 기록 시 DB 저장을 건너뛰지 않고, 가능한 경우 시도 (FK 에러 발생 가능성 있음)
        try {
          const newLog = await createMeetingLog({
            owner_id: currentUserId,
            audio_url: filePath,
          });
          await updateMeetingLogSTT(newLog.id, text);
          await indexKnowledge(newLog.id, 'MEETING_LOGS', text);
        } catch (dbError) {
          console.warn('DB 저장 실패 (테스트 모드):', dbError);
          // 테스트 모드에서는 DB 저장 실패해도 결과 화면은 보여줌
        }
      } else if (audioBlob) {
        // 1. Storage Upload
        const fileName = `${currentUserId}/meeting_${Date.now()}.wav`;
        filePath = await uploadAudio(audioBlob, fileName);
        
        // 2. STT Transcription
        text = await transcribeAudio(audioBlob);
        
        // 3. DB Insert/Update
        const newLog = await createMeetingLog({
          owner_id: currentUserId,
          audio_url: filePath,
        });
        await updateMeetingLogSTT(newLog.id, text);

        // 4. Integration (Pod C): Index Knowledge
        await indexKnowledge(newLog.id, 'MEETING_LOGS', text);
      }

      setIsCompleted(true);
      onComplete?.();
    } catch (error: any) {
      console.error('Failed to process meeting log:', error);
      // 서버 로그 파일에 기록
      logger.error('Meeting processing failed', {
        error: error.message || error,
        stack: error.stack,
        status,
        hasAudioBlob: !!audioBlob
      });
      alert('처리 중 오류가 발생했습니다. 로그 파일을 확인해 주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isIdle = (status === 'idle' || status === 'stopped') && !isProcessing;

  if (isCompleted) {
    return (
      <Card className="p-8 bg-surface shadow-soft border-none rounded-md flex flex-col items-center gap-4 max-w-md mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-success" />
        <h3 className="text-xl font-headings font-bold">처리 완료!</h3>
        <p className="text-muted font-body">회의록이 성공적으로 저장되고 STT 변환 및 지식 인덱싱이 완료되었습니다.</p>
        <Button onClick={() => { setIsCompleted(false); clearRecording(); }} className="mt-4 rounded-full px-8">
          새 녹음 시작
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-surface shadow-soft border-none rounded-md flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-xl font-headings font-semibold text-foreground">회의록 녹음</h3>
        <p className="text-sm text-muted font-body">
          {isProcessing ? '처리 중...' : isRecording ? '녹음 중...' : isPaused ? '일시 정지됨' : '녹음 준비 완료'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isIdle && !audioBlob && (
          <>
            <Button
              onClick={startRecording}
              className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-soft"
            >
              <Mic className="w-8 h-8 text-white" />
            </Button>
            <Button
              onClick={() => handleUpload(true)}
              className="rounded-full px-6 bg-secondary text-secondary-foreground shadow-soft gap-2"
            >
              <FileAudio className="w-4 h-4" />
              더미 데이터로 테스트
            </Button>
          </>
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

        {isProcessing && <Loader2 className="w-16 h-16 text-primary animate-spin" />}
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
