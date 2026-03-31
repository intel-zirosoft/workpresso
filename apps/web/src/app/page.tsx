import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const HERO_PROMPTS = [
  { label: "오늘 일정 요약", href: "/chat" },
  { label: "회의록 3줄 요약", href: "/chat" },
  { label: "사내 규약 검색", href: "/chat" },
];

const SUMMARY_CARDS = [
  {
    title: "오늘 일정",
    value: "확인",
    href: "/schedules",
    icon: CalendarDays,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "문서 작업",
    value: "이동",
    href: "/documents",
    icon: FileText,
    tone: "bg-amber-100 text-amber-600",
  },
  {
    title: "AI 시작",
    value: "질문",
    href: "/chat",
    icon: Bot,
    tone: "bg-violet-100 text-violet-600",
  },
] as const;

const PRIORITY_ITEMS = [
  "오늘 일정 먼저 점검",
  "문서/대화 분리 운영",
  "AI로 시작 비용 줄이기",
] as const;

const QUICK_ACTIONS = [
  {
    title: "문서 작성",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "일정 추가",
    href: "/schedules",
    icon: CalendarPlus,
  },
  {
    title: "AI 질문",
    href: "/chat",
    icon: Bot,
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-4 md:space-y-5">
      <header className="overflow-hidden rounded-[24px] border border-background/60 bg-surface px-4 py-4 shadow-soft md:px-5 md:py-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)] xl:items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              WorkPresso
            </div>
            <h1 className="text-xl font-headings font-bold tracking-tight text-text md:text-3xl">
              바로 시작하세요.
            </h1>
          </div>

          <div className="rounded-[20px] border border-background/60 bg-background/40 p-3 md:p-4">
            <Link
              href="/chat"
              className="flex min-h-12 items-center justify-between rounded-[18px] border border-background/70 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <p className="text-sm font-bold text-text">AI에게 물어보기</p>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              {HERO_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.label}
                  asChild
                  variant="outline"
                  className="h-8 rounded-pill border-background/70 bg-white px-3 text-[11px] font-bold text-text hover:bg-background"
                >
                  <Link href={prompt.href}>{prompt.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {SUMMARY_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[18px] border border-background/60 bg-background/40 p-3 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <card.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-headings text-sm font-bold text-text">
                    {card.title}
                  </p>
                  <p className="text-xs font-bold text-text/70">{card.value}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-[24px] border border-background/60 bg-surface p-4 shadow-soft">
          <div className="mb-3">
            <p className="text-xs font-bold text-primary">오늘 우선</p>
            <h2 className="mt-1 font-headings text-lg font-bold text-text">
              핵심만 확인하세요.
            </h2>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {PRIORITY_ITEMS.map((title, index) => (
              <div key={title} className="rounded-[18px] bg-background/50 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-primary shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-headings text-sm font-bold text-text">{title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-[24px] border border-background/60 bg-surface p-4 shadow-soft">
            <div className="mb-3">
              <h2 className="font-headings text-lg font-bold text-text">빠른 실행</h2>
            </div>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group block rounded-[16px] border border-background/60 bg-background/35 px-3 py-3 transition-all hover:bg-white hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headings text-sm font-bold text-text">
                        {action.title}
                      </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-success/20 bg-success/10 p-4 shadow-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-text">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              AI
            </div>
            <h2 className="font-headings text-base font-bold text-text">바로 시작</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-5 text-text/80">
              <li>• 오늘 일정 기준으로 우선순위를 정리해줘</li>
              <li>• 회의록 초안을 3줄로 요약해줘</li>
              <li>• 공유용 문서 목차를 먼저 만들어줘</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="h-9 rounded-pill px-4 text-sm font-bold shadow-soft">
                <Link href="/chat">
                  <Bot className="h-4 w-4" />
                  AI 채팅 열기
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
