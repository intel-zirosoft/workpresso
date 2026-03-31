"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CalendarPlus,
  FileText,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Send,
  BarChart2,
  FileSignature
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessenger } from "@/features/pod-e/contexts/messenger-context";
import { HomeCalendarWidget } from "./_components/home-calendar-widget";
import { UserProgressCard } from "./_components/user-progress-card";
import { EmbeddedAiWidget } from "./_components/embedded-ai-widget";

const QUICK_ACTIONS = [
  {
    title: "문서 초안 만들기",
    description: "AI가 제안하는 템플릿으로 시작",
    href: "/documents",
    icon: FileText,
    iconArea: "bg-primary/10 text-primary",
  },
  {
    title: "오늘 일정 정리",
    description: "나의 하루 스케줄 한눈에 확인",
    href: "/schedules",
    icon: CalendarPlus,
    iconArea: "bg-secondary/20 text-secondary-foreground",
  },
  {
    title: "AI에게 물어보기",
    description: "궁금한 점을 바로 해결하세요",
    href: "/chat",
    icon: MessageSquare,
    iconArea: "bg-info/10 text-info",
  },
  {
    title: "팀 상태 확인",
    description: "협업 중인 멤버들의 실시간 현황",
    href: "/teammates",
    icon: UsersIconCustom, // Defined below just for custom look
    iconArea: "bg-[#EAE4F5] text-[#7E57C2]", // subtle purple tone as requested by mockup
  },
];

const COLLABORATION_LINKS = [
  {
    title: "메신저로 빠르게 공유",
    href: "/messenger",
    icon: Send,
    iconStyle: "bg-info/10 text-info",
  },
  {
    title: "음성 회의록 남기기",
    href: "/voice",
    icon: Mic,
    iconStyle: "bg-destructive/10 text-destructive",
  },
  {
    title: "팀 상태 보드 보기",
    href: "/teammates",
    icon: BarChart2,
    iconStyle: "bg-success/20 text-success-foreground",
  },
];

// SVG component to simulate the mockup's unique purple team icon
function UsersIconCustom({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <circle cx="12" cy="7" r="3" />
      <circle cx="6" cy="15" r="3" />
      <circle cx="18" cy="15" r="3" />
    </svg>
  );
}

export default function HomePage() {
  const { openMessenger } = useMessenger();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
      
      {/* ========================================================= */}
      {/* ⬅️ LEFT COLUMN (Main Content) - Spans 3 columns           */}
      {/* ========================================================= */}
      <div className="xl:col-span-3 space-y-6 lg:space-y-8 flex flex-col h-full">
        
        {/* 1. TOP BANNER */}
        <section className="relative overflow-hidden rounded-[28px] border border-background/60 bg-surface-muted/60 px-6 py-8 md:px-10 md:py-10 shadow-sm flex flex-col gap-6">
          {/* Subtle wavy graphic decoration approximation */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top right, hsla(var(--primary), 0.15) 0%, transparent 70%)'
          }} />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shadow-sm border border-primary/10">
            <CalendarDays className="h-4 w-4" />
            오늘의 워크스페이스
          </div>

          {/* Titles & Buttons */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h1 className="text-[26px] font-headings font-bold tracking-tight text-text sm:text-3xl md:text-[32px] lg:leading-tight whitespace-nowrap">
              오늘의 일정을 한눈에 확인해보세요
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button asChild className="h-12 rounded-pill px-6 text-sm font-bold shadow-soft">
                <Link href="/documents">
                  <FileSignature className="h-4 w-4 mr-2" />
                  문서 작성 시작
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-pill border-background bg-surface px-6 text-sm font-bold text-text hover:bg-background/80 shadow-sm">
                <Link href="/chat">
                  <Bot className="h-4 w-4 mr-2 text-primary" />
                  AI에게 질문
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. QUICK ACTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-[24px] border border-background/60 bg-surface p-5 transition-all hover:-translate-y-1 hover:shadow-soft"
            >
              {/* Left Color Block */}
              <div
                className={`flex shrink-0 h-14 w-14 items-center justify-center rounded-2xl ${action.iconArea} shadow-inner`}
              >
                <action.icon className="h-6 w-6" />
              </div>

              {/* Text Block */}
              <div className="flex-1 min-w-0">
                <h2 className="font-headings text-lg font-bold text-text mb-1 truncate group-hover:text-primary transition-colors">
                  {action.title}
                </h2>
                <p className="text-sm font-medium text-text-muted truncate">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 3. HOME CALENDAR WIDGET */}
        <div className="flex-1 mt-2">
          <HomeCalendarWidget />
        </div>
      </div>

      
      {/* ========================================================= */}
      {/* ➡️ RIGHT COLUMN (Sidebar Actions) - Spans 1 column        */}
      {/* ========================================================= */}
      <aside className="xl:col-span-1 flex flex-col gap-6 lg:gap-8 min-h-full">

        {/* 1. RECOMMENDED TASKS */}
        <section className="flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-headings text-lg font-bold text-text">지금 하면 좋은 작업</h3>
            <button className="text-text-muted hover:text-text p-1 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {COLLABORATION_LINKS.map((item) => {
              const isMessenger = item.href === "/messenger";
              
              return (
                <Link
                  key={item.title}
                  href={isMessenger ? "#" : item.href}
                  onClick={(e) => {
                    if (isMessenger) {
                      e.preventDefault();
                      openMessenger();
                    }
                  }}
                  className="flex items-center gap-4 rounded-2xl bg-background/50 p-3 pl-4 transition-all hover:bg-surface hover:shadow-sm group border border-transparent hover:border-background/80"
                >
                  <div className={`flex shrink-0 h-8 w-8 items-center justify-center rounded-xl ${item.iconStyle}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="font-headings text-sm font-bold text-text/90 group-hover:text-text transition-colors">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. USER PROGRESS CARD */}
        <UserProgressCard />

        {/* 3. PROACTIVE AI WIDGET */}
        <div className="flex-1">
          <EmbeddedAiWidget />
        </div>

      </aside>
    </div>
  );
}
