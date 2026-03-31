"use client";

import { useEffect, useRef, type ElementType } from "react";
import { type Message } from "ai";
import { useChat } from "ai/react";
import {
  AlertTriangle,
  Bot,
  Clock,
  Code,
  Coffee,
  Droplets,
  Gift,
  Loader2,
  Send,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface QuickCommand {
  label: string;
  value: string;
  icon: ElementType;
}

export interface QueuedPrompt {
  id: number;
  content: string;
}

export const QUICK_COMMANDS: QuickCommand[] = [
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
        <Coffee className="h-8 w-8 text-primary/80" />
        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center space-y-1">
          <Droplets
            className="h-3 w-3 animate-bounce text-primary/40"
            style={{ animationDuration: "1.5s" }}
          />
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30" />
        </div>
      </div>
      <p className="text-center text-[10px] font-headings font-medium uppercase tracking-widest text-primary/60 animate-pulse">
        Brewing Answer...
      </p>
    </div>
  );
}

export function ChatPanel({
  variant = "page",
  queuedPrompt,
  onQueuedPromptHandled,
}: {
  variant?: "page" | "widget";
  queuedPrompt?: QueuedPrompt | null;
  onQueuedPromptHandled?: () => void;
}) {
  const isWidget = variant === "widget";
  const {
    messages,
    input,
    append,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: "/api/chat",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastQueuedPromptIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (
      !queuedPrompt ||
      isLoading ||
      lastQueuedPromptIdRef.current === queuedPrompt.id
    ) {
      return;
    }

    lastQueuedPromptIdRef.current = queuedPrompt.id;

    void append({
      role: "user",
      content: queuedPrompt.content,
    }).finally(() => {
      onQueuedPromptHandled?.();
    });
  }, [append, isLoading, onQueuedPromptHandled, queuedPrompt]);

  const handleQuickCommand = async (value: string) => {
    if (isLoading) {
      return;
    }

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
    <div
      className={cn(
        "flex flex-col",
        isWidget
          ? "h-[min(78vh,720px)] rounded-[32px] border border-background/60 bg-background/95 p-4 shadow-2xl backdrop-blur"
          : "mx-auto h-[calc(100vh-10rem)] max-w-4xl space-y-4 md:h-[calc(100vh-12rem)] md:space-y-6",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-2",
          isWidget && "mb-3 border-b border-background/60 px-1 pb-3",
        )}
      >
        <div>
          <h1
            className={cn(
              "font-headings font-bold tracking-tight text-primary",
              isWidget ? "text-xl" : "text-2xl md:text-4xl",
            )}
          >
            업무 비서
          </h1>
          <p className="mt-1 font-body text-xs text-text-muted md:text-base">
            일정과 문서, 회의록까지 한 번에 찾는 AI 비서입니다.
          </p>
        </div>
        <div className="rounded-md bg-secondary/10 p-3 shadow-soft">
          <Sparkles className="h-5 w-5 text-secondary md:h-6 md:w-6" />
        </div>
      </div>

      <Card
        className={cn(
          "relative flex-1 overflow-hidden border-none bg-surface/50 shadow-soft backdrop-blur-sm",
          isWidget && "min-h-0 rounded-[28px]",
        )}
      >
        <CardContent className="h-full p-0">
          <div
            ref={scrollRef}
            className="scrollbar-hide h-full overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center space-y-6 text-center opacity-70">
                <div className="rounded-pill bg-primary/10 p-4 shadow-soft md:p-6">
                  <Bot className="h-10 w-10 text-primary md:h-14 md:w-14" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headings font-semibold text-text md:text-2xl">
                    무엇을 도와드릴까요?
                  </h3>
                  <p className="mx-auto max-w-[280px] font-body text-xs text-text-muted md:max-w-xs md:text-sm">
                    아래 명령어를 클릭하거나 질문을 입력해 보세요.
                  </p>
                </div>

                <div className="flex max-w-md flex-wrap justify-center gap-2 px-4">
                  {QUICK_COMMANDS.map((cmd) => {
                    const CommandIcon = cmd.icon;

                    return (
                      <Button
                        key={cmd.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCommand(cmd.value)}
                        className="rounded-pill border-primary/10 bg-surface/80 text-xs transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <CommandIcon className="mr-1.5 h-3.5 w-3.5" />
                        {cmd.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={cn(
                  "flex animate-in items-start gap-2 slide-in-from-bottom-3 fade-in duration-300 md:gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill shadow-soft md:h-11 md:w-11",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary/10 bg-surface text-primary",
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Bot className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </div>

                <div
                  className={cn(
                    "max-w-[85%] rounded-md px-4 py-3 font-body text-sm leading-relaxed shadow-soft transition-all md:max-w-[75%] md:px-6 md:py-4 md:text-[15px]",
                    message.role === "user"
                      ? "rounded-tr-none bg-primary text-primary-foreground"
                      : "rounded-tl-none border border-primary/5 bg-surface text-text",
                  )}
                >
                  <ReactMarkdown
                    className={cn(
                      "prose prose-sm max-w-none",
                      message.role === "user"
                        ? "prose-invert"
                        : "prose-neutral font-medium",
                    )}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex animate-in items-start gap-2 fade-in duration-300 md:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-primary/10 bg-surface text-primary shadow-soft md:h-11 md:w-11">
                    <Bot className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="rounded-md rounded-tl-none border border-primary/5 bg-surface px-6 py-4 shadow-soft">
                    <CoffeeLoader />
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <div className={cn("space-y-3", isWidget && "pt-3")}>
        {messages.length > 0 && !isLoading && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto px-2 pb-1">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.value}
                onClick={() => handleQuickCommand(cmd.value)}
                className="whitespace-nowrap rounded-full border border-primary/10 bg-surface px-3 py-1.5 text-[11px] font-medium text-text-muted shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative group transition-all duration-300 focus-within:-translate-y-1",
            isWidget ? "" : "pb-4 md:pb-0",
          )}
        >
          <div className="relative flex items-center rounded-pill border-2 border-transparent bg-surface p-1 shadow-soft focus-within:border-primary/20">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="명령어를 입력하거나 질문을 작성하세요..."
              className="h-12 flex-1 border-none bg-transparent pl-5 pr-14 font-body text-sm text-text shadow-none placeholder:text-text-muted focus-visible:ring-0 md:h-14 md:pl-8 md:pr-16 md:text-base"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "h-10 w-10 rounded-pill p-0 shadow-soft transition-all duration-300 md:h-12 md:w-12",
                input.trim()
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-muted/20 text-text-muted",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
              ) : (
                <Send
                  className={cn(
                    "h-4 w-4 transition-transform md:h-5 md:w-5",
                    input.trim() && "-translate-y-0.5 translate-x-0.5",
                  )}
                />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
