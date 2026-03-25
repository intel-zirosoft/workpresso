'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Calendar, User as UserIcon, FileText } from 'lucide-react';

interface MeetingLogDetailProps {
  log: {
    id: string;
    created_at: string;
    audio_url: string;
    stt_text: string | null;
    owner_id?: string;
  };
}

export const MeetingLogDetail: React.FC<MeetingLogDetailProps> = ({ log }) => {
  return (
    <Card className="p-8 bg-surface shadow-soft border-none rounded-md flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted text-sm font-body">
          <Calendar className="w-4 h-4" />
          <span>{new Date(log.created_at).toLocaleString()} 회의</span>
        </div>
        <h2 className="text-3xl font-headings font-bold text-foreground">회의록 상세</h2>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          음성 다시 듣기
        </h3>
        <WaveformVisualizer audioUrl={log.audio_url} />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          변환된 텍스트
        </h3>
        <div className="p-6 bg-background rounded-sm min-h-[200px] font-body leading-relaxed text-foreground whitespace-pre-wrap">
          {log.stt_text || (
            <span className="text-muted italic">STT 변환 결과가 없습니다.</span>
          )}
        </div>
      </div>
    </Card>
  );
};
