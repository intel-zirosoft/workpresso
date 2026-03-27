"use client";

import { useChat } from "ai/react";
import { type Message } from "ai";
import { Send, Bot, User, Loader2, Sparkles, Code, Gift, AlertTriangle, Clock, Shield, Coffee, Droplets } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, type ElementType } from "react";

interface QuickCommand {
  label: string;
  value: string;
  icon: ElementType;
}

const QUICK_COMMANDS: QuickCommand[] = [
  { label: "개발표준", value: "/개발표준", icon: Code },
  { label: "복리후생", value: "/복리후생", icon: Gift },
  { label: "주의사항", value: "/주의사항", icon: AlertTriangle },
  { label: "근무환경", value: "/근무환경", icon: Clock },
  { label: "보안수칙", value: "/보안수칙", icon: Shield },
];

function CoffeeLoader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-2">
      <div className="relative">
        <Coffee className="w-8 h-8 text-primary/80" />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 space-y-1 flex flex-col items-center">
          <Droplets className="w-3 h-3 text-primary/40 animate-bounce" style={{ animationDuration: '1.5s' }} />
          <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" />
        </div>
      </div>
      <p className="text-[10px] font-headings font-medium text-primary/60 animate-pulse uppercase tracking-widest text-center">
        Brewing Answer...
      </p>
    </div>
  );
}

export default function ChatPage() {
  const { messages, input, append, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const handleQuickCommand = async (value: string) => {
    if (isLoading) return;
    try {
      await append({
        role: "user",
        content: value,
      });
    } catch (error) {
      console.error("Append error:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl md:text-4xl font-headings font-bold text-primary tracking-tight">
            업무 비서
          </h1>
          <p className="text-muted font-body mt-1 text-xs md:text-base">
            당신의 업무 일정과 지식 베이스를 관리하는 AI 비서입니다.
          </p>
        </div>
        <div className="hidden sm:block bg-secondary/10 p-3 rounded-md shadow-soft">
          <Sparkles className="text-secondary w-5 h-5 md:h-6 md:w-6" />
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-none shadow-soft bg-surface/50 backdrop-blur-sm relative">
        <CardContent className="h-full p-0">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70">
                <div className="p-4 md:p-6 bg-primary/10 rounded-pill shadow-soft">
                  <Bot className="text-primary w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-headings text-xl md:text-2xl font-semibold text-text">무엇을 도와드릴까요?</h3>
                  <p className="font-body text-xs md:text-sm text-muted max-w-[250px] md:max-w-xs mx-auto">
                    아래 명령어를 클릭하거나 질문을 입력해 보세요.
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 max-w-md px-4">
                  {QUICK_COMMANDS.map((cmd) => {
                    const CommandIcon = cmd.icon;
                    return (
                      <Button
                        key={cmd.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCommand(cmd.value)}
                        className="rounded-pill bg-white/50 border-primary/10 hover:bg-primary hover:text-white transition-all text-xs"
                      >
                        <CommandIcon className="w-3.5 h-3.5 mr-1.5" />
                        {cmd.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {messages.map((m: Message) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 md:w-11 md:h-11 rounded-pill flex items-center justify-center shrink-0 shadow-soft",
                  m.role === "user" ? "bg-primary text-white" : "bg-white text-primary border border-primary/10"
                )}>
                  {m.role === "user" ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                
                <div className={cn(
                  "max-w-[85%] md:max-w-[75%] px-4 py-3 md:px-6 md:py-4 rounded-md font-body text-sm md:text-[15px] leading-relaxed shadow-soft transition-all",
                  m.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-text rounded-tl-none border border-primary/5"
                )}>
                  <ReactMarkdown 
                    className={cn(
                      "prose prose-sm max-w-none",
                      m.role === "user" ? "prose-invert" : "prose-neutral font-medium"
                    )}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-2 md:gap-3 animate-in fade-in duration-300">
                <div className="w-8 h-8 md:w-11 md:h-11 rounded-pill bg-white text-primary flex items-center justify-center shrink-0 shadow-soft border border-primary/10">
                  <Bot className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="bg-white px-6 py-4 rounded-md rounded-tl-none border border-primary/5 shadow-soft">
                  <CoffeeLoader />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {messages.length > 0 && !isLoading && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.value}
                onClick={() => handleQuickCommand(cmd.value)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-surface border border-primary/10 text-[11px] font-medium text-muted hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className="relative group transition-all duration-300 focus-within:-translate-y-1 pb-4 md:pb-0"
        >
          <div className="relative flex items-center bg-white rounded-pill shadow-soft p-1 border-2 border-transparent focus-within:border-primary/20">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="명령어를 입력하거나 질문을 작성하세요..."
              className="flex-1 h-12 md:h-14 pl-5 md:pl-8 pr-14 md:pr-16 border-none shadow-none bg-transparent font-body text-sm md:text-base placeholder:text-muted focus-visible:ring-0"
            />
            <Button 
              type="submit" 
              disabled={!input?.trim() || isLoading}
              className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-pill p-0 transition-all duration-300 shadow-soft",
                input?.trim() ? "bg-primary hover:bg-primary/90" : "bg-muted/20 text-muted"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform", input?.trim() && "translate-x-0.5 -translate-y-0.5")} />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
