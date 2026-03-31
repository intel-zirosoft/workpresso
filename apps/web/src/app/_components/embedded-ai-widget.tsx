"use client";

import { Sparkles, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EmbeddedAiWidget() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // In a real implementation, you'd pass the initial message to the chat page
      router.push("/chat");
    }
  };

  return (
    <div className="rounded-[28px] border border-background/60 bg-surface shadow-soft p-5 flex flex-col h-full group hover:shadow-float transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary text-surface p-1.5 rounded-xl shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="font-headings text-xl font-bold text-text tracking-tight">
          WorkPresso AI
        </h2>
      </div>

      {/* Message Bubble */}
      <div className="bg-background/40 rounded-2xl rounded-tl-sm p-4 text-sm leading-6 text-text/80 mb-5 relative">
        안녕하세요! 어제 작성하시던 
        <strong className="text-primary font-bold"> &apos;분기 보고서&apos;</strong>를 
        이어서 작성해볼까요? 아니면 
        오늘 일정을 바탕으로 우선순위를 추천해 드릴까요?
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative mt-auto">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Sparkles className="h-4 w-4 text-primary/40" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AI에게 물어보세요..."
          className="w-full bg-background/50 border border-transparent rounded-pill py-3 pl-10 pr-12 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
        />
        <button
          type="submit"
          className="absolute inset-y-1 right-1 p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
          disabled={!input.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Link 
          href="/chat"
          className="text-xs font-bold text-text-muted bg-background/50 hover:bg-background border border-background hover:border-border/50 rounded-pill px-3 py-1.5 transition-all"
        >
          오늘 일정 요약
        </Link>
        <Link 
          href="/chat"
          className="text-xs font-bold text-text-muted bg-background/50 hover:bg-background border border-background hover:border-border/50 rounded-pill px-3 py-1.5 transition-all"
        >
          보고서 템플릿
        </Link>
      </div>
    </div>
  );
}
