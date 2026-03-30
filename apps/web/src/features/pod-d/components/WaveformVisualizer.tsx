'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformVisualizerProps {
  audioUrl?: string;
  blob?: Blob;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUrl, blob }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 언마운트 여부 추적 — 파괴된 이후 state 업데이트 방지
    let isDestroyed = false;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#7FA1C3',
      progressColor: '#2C394B',
      cursorColor: '#F2C18D',
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 80,
      normalize: true,
    });

    wavesurferRef.current = ws;

    // load 중 발생하는 AbortError를 이벤트 레벨에서 흡수
    ws.on('error', (err: any) => {
      if (isDestroyed) return; // 언마운트 후 에러는 무시
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return;
      console.error('[WaveformVisualizer] WaveSurfer error:', err);
    });

    if (blob) {
      ws.loadBlob(blob);
    } else if (audioUrl) {
      ws.load(audioUrl);
    }

    ws.on('play', () => { if (!isDestroyed) setIsPlaying(true); });
    ws.on('pause', () => { if (!isDestroyed) setIsPlaying(false); });
    ws.on('finish', () => { if (!isDestroyed) setIsPlaying(false); });

    return () => {
      isDestroyed = true;
      
      const wavesurfer = wavesurferRef.current;
      if (wavesurfer) {
        // 중복 호출 방지를 위해 즉시 참조 제거
        wavesurferRef.current = null;
        try {
          // 모든 리스너 우선 해제 (AbortError가 전파되는 통로를 차단)
          wavesurfer.unAll();
          
          // 소멸 호출 시 발생하는 AbortError는 이미 로딩 취소의 결과이므로 무시하도록 설계
          // 일부 브라우저/버전에서는 destroy()가 동기적으로 에러를 던질 수 있음
          wavesurfer.destroy();
        } catch (e: any) {
          // AbortError 및 비동기 소멸 과정의 오류는 전역으로 전파되지 않도록 무시
          const isAbortError = e?.name === 'AbortError' || e?.message?.includes('aborted');
          if (!isAbortError) {
            console.warn('[WaveformVisualizer] Non-critical cleanup info:', e);
          }
        }
      }
    };
  }, [audioUrl, blob]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-white rounded-md shadow-soft">
      <div ref={containerRef} className="w-full" />
      <div className="flex justify-center">
        <Button
          onClick={togglePlay}
          className="rounded-full w-10 h-10 shadow-soft bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center p-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};
