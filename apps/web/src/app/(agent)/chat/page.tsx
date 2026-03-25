"use client";

import { useChat } from "ai/react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // 메시지 업데이트 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto space-y-6">
      {/* Header 섹션 */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-4xl font-headings font-bold text-primary tracking-tight">
            업무 비서
          </h1>
          <p className="text-muted font-body mt-1">
            당신의 업무 일정과 지식 베이스를 관리하는 AI 비서입니다.
          </p>
        </div>
        <div className="bg-secondary/10 p-3 rounded-md shadow-soft">
          <Sparkles className="text-secondary h-6 w-6" />
        </div>
      </div>

      {/* 메시지 영역 */}
      <Card className="flex-1 overflow-hidden border-none shadow-soft bg-surface/50 backdrop-blur-sm relative">
        <CardContent className="h-full p-0">
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto p-6 space-y-6 scrollbar-hide"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                <div className="p-6 bg-primary/10 rounded-pill shadow-soft mb-2">
                  <Bot size={56} className="text-primary" />
                </div>
                <h3 className="font-headings text-2xl font-semibold text-text">안녕하세요!</h3>
                <p className="font-body text-muted max-w-xs mx-auto">
                  "내일 오전 회의 일정 잡아줘" 또는<br />
                  "최근 진행된 회의록 요약해줘"라고 말해보세요.
                </p>
              </div>
            )}
            
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* 아바타 */}
                <div className={cn(
                  "w-11 h-11 rounded-pill flex items-center justify-center shrink-0 shadow-soft",
                  m.role === "user" ? "bg-primary text-white" : "bg-white text-primary border border-primary/10"
                )}>
                  {m.role === "user" ? <User size={22} /> : <Bot size={22} />}
                </div>
                
                {/* 메시지 버블 */}
                <div className={cn(
                  "max-w-[75%] px-6 py-4 rounded-md font-body text-[15px] leading-relaxed shadow-soft transition-all",
                  m.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-text rounded-tl-none border border-primary/5"
                )}>
                  <ReactMarkdown 
                    className={cn(
                      "prose prose-sm max-w-none",
                      m.role === "user" ? "prose-invert" : "prose-neutral"
                    )}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {/* AI 답변 대기 중 로딩 스피너 */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <div className="w-11 h-11 rounded-pill bg-white text-primary flex items-center justify-center shrink-0 shadow-soft border border-primary/10">
                  <Bot size={22} />
                </div>
                <div className="bg-white px-6 py-5 rounded-md rounded-tl-none border border-primary/5 shadow-soft">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 입력 영역 */}
      <form 
        onSubmit={handleSubmit} 
        className="relative group transition-all duration-300 focus-within:-translate-y-1"
      >
        <div className="relative flex items-center bg-white rounded-pill shadow-soft p-1 border-2 border-transparent focus-within:border-primary/20">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="업무에 대해 무엇이든 물어보세요..."
            className="flex-1 h-14 pl-8 pr-16 border-none shadow-none bg-transparent font-body text-base placeholder:text-muted focus-visible:ring-0"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className={cn(
              "h-12 w-12 rounded-pill p-0 transition-all duration-300 shadow-soft",
              input.trim() ? "bg-primary hover:bg-primary/90" : "bg-muted/20 text-muted"
            )}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} className={cn("transition-transform", input.trim() && "translate-x-0.5 -translate-y-0.5")} />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted text-center mt-3 font-body opacity-60">
          WorkPresso AI는 업무를 돕기 위해 실시간으로 응답하며, 정확한 일정과 문서를 참조합니다.
        </p>
      </form>
    </div>
  );
}
