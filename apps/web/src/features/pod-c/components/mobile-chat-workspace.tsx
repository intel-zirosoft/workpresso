"use client";

import { useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  MessageSquareText,
  Mic,
  Sparkles,
} from "lucide-react";

import {
  ChatPanel,
  type QueuedPrompt,
  type QuickCommand,
} from "@/features/pod-c/components/chat-panel";

const MOBILE_QUICK_COMMANDS: QuickCommand[] = [
  {
    label: "오늘 일정 요약",
    value: "오늘 내 일정과 곧 시작할 회의를 요약해줘.",
    icon: CalendarDays,
  },
  {
    label: "승인 대기 브리핑",
    value: "내가 확인해야 할 승인 대기 문서를 우선순위대로 정리해줘.",
    icon: ClipboardCheck,
  },
  {
    label: "읽지 않은 채터",
    value: "읽지 않은 채터와 중요한 대화를 빠르게 브리핑해줘.",
    icon: MessageSquareText,
  },
  {
    label: "회의 준비",
    value: "오늘 예정된 회의 준비 체크리스트를 만들어줘.",
    icon: Mic,
  },
];

export function MobileChatWorkspace() {
  const [queuedPrompt, setQueuedPrompt] = useState<QueuedPrompt | null>(null);

  const queuePrompt = (content: string) => {
    setQueuedPrompt({
      id: Date.now(),
      content,
    });
  };

  return (
    <ChatPanel
      queuedPrompt={queuedPrompt}
      onQueuedPromptHandled={() => setQueuedPrompt(null)}
      quickCommands={MOBILE_QUICK_COMMANDS}
      title="업무 도우미"
      description="오늘 일정, 승인 대기, 읽지 않은 채터처럼 지금 처리할 일을 빠르게 물어볼 수 있습니다."
      emptyTitle="오늘 필요한 질문부터 바로 시작하세요."
      emptyDescription="앱에 맞춘 빠른 질의 중심 화면입니다. 자주 쓰는 브리핑을 한 번에 실행할 수 있습니다."
      inputPlaceholder="예: 오늘 우선 처리할 일을 요약해줘"
      preContent={
        <section className="grid gap-3 md:grid-cols-2">
          {[
            {
              description: "오늘 일정과 가까운 회의를 한 번에 확인합니다.",
              label: "오늘 일정 브리핑",
              prompt: "오늘 내 일정과 가까운 회의를 요약해줘.",
            },
            {
              description: "승인 대기 문서와 먼저 볼 항목을 정리합니다.",
              label: "문서 inbox 정리",
              prompt: "승인 대기 문서를 우선순위대로 정리해줘.",
            },
            {
              description: "읽지 않은 채터와 중요한 대화만 빠르게 훑습니다.",
              label: "채터 빠른 확인",
              prompt: "읽지 않은 채터와 중요한 대화만 짧게 요약해줘.",
            },
            {
              description: "회의/통화 전 체크리스트나 메모 흐름을 정리합니다.",
              label: "회의 준비 도우미",
              prompt: "오늘 회의 준비 체크리스트를 만들어줘.",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => queuePrompt(item.prompt)}
              className="rounded-[24px] border border-background/60 bg-surface px-4 py-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="font-headings text-lg font-bold text-text">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                {item.description}
              </p>
            </button>
          ))}
        </section>
      }
    />
  );
}
