'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformVisualizerProps {
  audioUrl?: string;
  blob?: Blob;
}

type WaveformPalette = {
  waveColor: string;
  progressColor: string;
  cursorColor: string;
};

const FALLBACK_PALETTE: WaveformPalette = {
  waveColor: 'hsl(210 38% 63%)',
  progressColor: 'hsl(216 26% 23%)',
  cursorColor: 'hsl(32 83% 75%)',
};

function getCssTokenColor(name: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : fallback;
}

function getWaveformPalette(): WaveformPalette {
  return {
    waveColor: getCssTokenColor('--primary', FALLBACK_PALETTE.waveColor),
    progressColor: getCssTokenColor('--text', FALLBACK_PALETTE.progressColor),
    cursorColor: getCssTokenColor('--secondary', FALLBACK_PALETTE.cursorColor),
  };
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUrl, blob }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [palette, setPalette] = useState<WaveformPalette>(FALLBACK_PALETTE);

  useEffect(() => {
    setPalette(getWaveformPalette());

    if (typeof MutationObserver === 'undefined') {
      return;
    }

    const observer = new MutationObserver(() => {
      setPalette(getWaveformPalette());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // 언마운트 여부 추적 — 파괴된 이후 state 업데이트 방지
    let isDestroyed = false;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: palette.waveColor,
      progressColor: palette.progressColor,
      cursorColor: palette.cursorColor,
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
      // destroy()가 내부적으로 던지는 비동기 AbortError를 catch하기 위해
      // Promise 체인으로 래핑하여 unhandled rejection 방지
      Promise.resolve().then(() => {
        try {
          ws.destroy();
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            console.error('[WaveformVisualizer] destroy error:', e);
          }
        }
      }).catch(() => {
        // destroy() 내부의 비동기 AbortError 흡수
      });
    };
  }, [audioUrl, blob, palette]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 rounded-md bg-surface p-4 shadow-soft">
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
