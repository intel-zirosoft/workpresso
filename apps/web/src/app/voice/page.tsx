'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic2, FileAudio, History, ArrowLeft } from 'lucide-react';
import { listMeetingLogs } from '@/features/pod-d/services/meetingLogService';
import { MeetingLogDetail } from '@/features/pod-d/components/MeetingLogDetail';
import { createClient } from '@/lib/supabase/client';

const AudioRecorderDynamic = dynamic(() => import('@/features/pod-d').then(mod => mod.AudioRecorder), {
  ssr: false,
});

export default function VoicePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const userId = user.id;
      const data = await listMeetingLogs(userId);
      
      // Update logs list with real data
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (selectedLog) {
    return (
      <div className="container mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedLog(null)}
          className="rounded-full gap-2 mb-4 hover:bg-surface"
        >
          <ArrowLeft className="w-4 h-4" /> 리스트로 돌아가기
        </Button>
        <MeetingLogDetail log={selectedLog} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-md">
            <Mic2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-headings font-bold text-foreground">회의 소통 (Voice)</h1>
            <p className="text-muted font-body">음성을 녹음하고 AI를 통해 회의록으로 자동 변환하세요.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/api/logs', '_blank')}
          className="rounded-full text-muted hover:text-text gap-2"
        >
          기본 로그 확인
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Recorder Section */}
        <section className="space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Mic2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-headings font-bold">새 회의 시작하기</h2>
          </div>
          <AudioRecorderDynamic onComplete={fetchLogs} />
          
          <div className="mt-8 p-6 border border-dashed border-background rounded-lg bg-surface/50 text-center">
            <p className="text-sm text-muted font-body leading-relaxed">
              회의를 시작하려면 위 버튼을 눌러주세요.<br />
              변환된 데이터는 옆 히스토리에서 확인 가능합니다.
            </p>
          </div>
        </section>

        {/* List Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-headings font-bold">최근 회의 기록</h2>
            </div>
            <span className="text-sm text-muted">{logs.length}개의 기록</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-center py-12 text-muted animate-pulse font-body">데이터를 불러오는 중...</p>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <Card 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="p-5 bg-surface hover:bg-white hover:shadow-float transition-all cursor-pointer border-none shadow-soft flex items-center gap-4 group"
                >
                  <div className="bg-primary/5 p-3 rounded-md group-hover:bg-primary/10 transition-colors">
                    <FileAudio className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headings font-bold text-text truncate">
                      {new Date(log.created_at).toLocaleDateString()} 회의 기록
                    </h4>
                    <p className="text-sm text-muted truncate font-body">
                      {log.stt_text || '변환된 텍스트가 없습니다.'}
                    </p>
                  </div>
                  <div className="text-xs text-muted font-body">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-surface rounded-lg border border-dashed border-muted/30">
                <p className="text-muted font-body">아직 기록된 회의가 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
