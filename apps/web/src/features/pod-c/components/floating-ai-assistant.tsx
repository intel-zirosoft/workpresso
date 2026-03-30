"use client";

import { Bot, CalendarClock, FileText, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  ChatPanel,
  type QueuedPrompt,
} from "@/features/pod-c/components/chat-panel";

const QUICK_MENU = [
  {
    label: "오늘 일정",
    prompt: "오늘 내 일정과 가까운 일정들을 요약해줘.",
    icon: CalendarClock,
  },
  {
    label: "문서 찾기",
    prompt: "최근 생성된 문서 중 내가 참고할 만한 내용을 요약해줘.",
    icon: FileText,
  },
  {
    label: "보안수칙",
    prompt: "내부 보안수칙 핵심만 빠르게 알려줘.",
    icon: Shield,
  },
];

const HIDDEN_PATHS = ["/login", "/signup"];

export function FloatingAIAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<QueuedPrompt | null>(null);

  if (HIDDEN_PATHS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  const handleQuickMenuClick = (prompt: string) => {
    setQueuedPrompt({
      id: Date.now(),
      content: prompt,
    });
    setOpen(true);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
        {QUICK_MENU.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleQuickMenuClick(item.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-white/95 px-3 py-2 text-[11px] font-semibold text-text shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="pointer-events-auto h-14 rounded-full px-5 shadow-xl shadow-primary/20">
            <Bot className="h-5 w-5" />
            AI에게 질문
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[min(100vw-1rem,460px)] max-w-none border-none bg-transparent p-0 shadow-none">
          <ChatPanel
            variant="widget"
            queuedPrompt={queuedPrompt}
            onQueuedPromptHandled={() => setQueuedPrompt(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
