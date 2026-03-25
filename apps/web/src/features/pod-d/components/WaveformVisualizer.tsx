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

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#7FA1C3', // --color-primary
      progressColor: '#2C394B', // --color-text
      cursorColor: '#F2C18D', // --color-accent
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 80,
      normalize: true,
    });

    wavesurferRef.current = ws;

    if (blob) {
      ws.loadBlob(blob);
    } else if (audioUrl) {
      ws.load(audioUrl);
    }

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => {
      ws.destroy();
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
