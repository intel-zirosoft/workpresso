"use client";

import { Bot, CalendarClock, FileText, Shield, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { isChromelessPath } from "@/components/shared/navigation";
import { cn } from "@/lib/utils";
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

export function FloatingAIAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<QueuedPrompt | null>(null);

  if (isChromelessPath(pathname)) {
    return null;
  }

  const handleQuickMenuClick = (prompt: string) => {
    setQueuedPrompt({
      id: Date.now(),
      content: prompt,
    });
    setQuickMenuOpen(false);
    setOpen(true);
  };

  return (
    <div className="group fixed bottom-4 right-4 z-50 flex items-end">
      <div
        className={cn(
          "pointer-events-none absolute bottom-full right-0 flex max-w-[calc(100vw-2rem)] translate-y-2 flex-wrap justify-end gap-2 pb-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100",
          quickMenuOpen && "pointer-events-auto translate-y-0 opacity-100",
        )}
      >
        {QUICK_MENU.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleQuickMenuClick(item.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-surface/95 px-3 py-2 text-[11px] font-semibold text-text shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="pointer-events-auto h-11 w-11 rounded-full border border-background/70 bg-surface/90 shadow-soft md:hidden"
          aria-label="추천 질문 보기"
          aria-expanded={quickMenuOpen}
          onClick={() => setQuickMenuOpen((prev) => !prev)}
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen) {
              setQuickMenuOpen(false);
            }
          }}
        >
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
    </div>
  );
}
