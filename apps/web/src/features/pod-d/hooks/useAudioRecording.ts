'use client';

import { useState, useCallback } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

export const useAudioRecording = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const onStop = useCallback((blobUrl: string, blob: Blob) => {
    setAudioUrl(blobUrl);
    setAudioBlob(blob);
  }, []);

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop,
  });

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
  }, []);

  return {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl: audioUrl || mediaBlobUrl,
    audioBlob,
    clearRecording,
  };
};
