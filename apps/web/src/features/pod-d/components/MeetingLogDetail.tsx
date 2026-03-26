'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Calendar, User as UserIcon, FileText, CheckCircle2, ListTodo, Users, MessageSquareText, Download, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MeetingLogDetailProps {
  log: {
    id: string;
    created_at: string;
    audio_url: string;
    stt_text: string | null;
    title: string | null;
    summary: string | null;
    action_items: any[] | null;
    participants: string[] | null;
    is_refined: boolean;
    owner_id?: string;
  };
}

export const MeetingLogDetail: React.FC<MeetingLogDetailProps> = ({ log }) => {
  const handleDownload = () => {
    const dateStr = new Date(log.created_at).toLocaleString();
    const content = `# ${log.title || '회의록'}
**회의 일시:** ${dateStr}
**참여자:** ${log.participants?.join(', ') || '없음'}

## 📝 회의 요약
${log.summary || '요약 내용이 없습니다.'}

## ✅ 주요 액션 아이템
${log.action_items && log.action_items.length > 0 
  ? log.action_items.map((item: any) => `- [ ] ${item.task}${item.assignee ? ` (담당: ${item.assignee})` : ''}${item.due_date ? ` (기한: ${item.due_date})` : ''}`).join('\n')
  : '도출된 액션 아이템이 없습니다.'}

---
## 🎙️ STT 원본 (원본 텍스트)
${log.stt_text || '기록된 텍스트가 없습니다.'}

---
*WorkPresso AI를 통해 생성된 회의록입니다.*
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${log.title || 'meeting_log'}_${new Date(log.created_at).toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8 bg-surface shadow-soft border-none rounded-md flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted text-sm font-body">
            <Calendar className="w-4 h-4" />
            <span>{new Date(log.created_at).toLocaleString()} 회의</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="rounded-full gap-2 text-xs border-primary/20 hover:bg-primary/5"
            >
              <FileDown className="w-3.5 h-3.5" /> 다운로드 (Markdown)
            </Button>
            {log.is_refined && (
              <Badge className="bg-success/10 text-success border-success/20 gap-1 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> AI 정제 완료
              </Badge>
            )}
          </div>
        </div>
        <h2 className="text-3xl font-headings font-bold text-foreground">
          {log.title || '회의록 상세'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            음성 다시 듣기
          </h3>
          <WaveformVisualizer audioUrl={log.audio_url} />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            참여자
          </h3>
          <div className="p-4 bg-background rounded-sm flex flex-wrap gap-2">
            {log.participants && log.participants.length > 0 ? (
              log.participants.map((name, i) => (
                <Badge key={i} variant="secondary" className="rounded-full px-3">{name}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted italic">식별된 참여자가 없습니다.</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* 요약 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            회의 핵심 요약
          </h3>
          <div className="p-6 bg-primary/5 border border-primary/10 rounded-lg font-body leading-relaxed text-foreground">
            {log.summary || (
              <span className="text-muted italic">AI 요약 결과가 없습니다. 정제 중이거나 분석에 실패했습니다.</span>
            )}
          </div>
        </div>

        {/* 액션 아이템 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            주요 액션 아이템
          </h3>
          <div className="space-y-3">
            {log.action_items && log.action_items.length > 0 ? (
              log.action_items.map((item: any, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border/50">
                  <div className="mt-1 w-4 h-4 rounded-full border-2 border-primary/30" />
                  <div className="flex-1">
                    <p className="font-medium">{item.task}</p>
                    <div className="flex gap-4 mt-1">
                      {item.assignee && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> 담당: {item.assignee}
                        </span>
                      )}
                      {item.due_date && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 기한: {item.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-background border border-dashed rounded-lg text-center text-muted text-sm">
                도출된 액션 아이템이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 원본 텍스트 */}
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2 text-muted">
            <FileText className="w-5 h-5" />
            STT 원본 텍스트
          </h3>
          <div className="p-6 bg-background/50 border border-muted/20 rounded-lg text-sm font-body leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {log.stt_text || '기록된 텍스트가 없습니다.'}
          </div>
        </div>
      </div>
    </Card>
  );
};
