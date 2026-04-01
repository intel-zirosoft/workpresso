"use client";

import Link from "next/link";
import {
  FileText,
  CalendarPlus,
  MessageSquare,
  Users,
  Send,
  Mic,
  ArrowUpRight,
  CircleAlert,
  Mail,
  FolderArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessenger } from "@/features/pod-e/contexts/messenger-context";
import { HomeCalendarWidget } from "./_components/home-calendar-widget";
import { UserProgressCard } from "./_components/user-progress-card";
import { EmbeddedAiWidget } from "./_components/embedded-ai-widget";

const DASHBOARD_SHORTCUTS = [
  {
    title: "문서 작성",
    description: "템플릿으로 빠르게 시작",
    href: "/documents",
    icon: FileText,
    iconArea: "bg-primary/10 text-primary",
  },
  {
    title: "일정 관리",
    description: "오늘의 스케줄 확인",
    href: "/schedules",
    icon: CalendarPlus,
    iconArea: "bg-secondary/70 text-text-muted",
  },
  {
    title: "AI 비서",
    description: "지능형 업무 도우미",
    href: "/chat",
    icon: MessageSquare,
    iconArea: "bg-info/10 text-info",
  },
  {
    title: "팀 멤버",
    description: "실시간 동료 현황",
    href: "/teammates",
    icon: Users,
    iconArea: "bg-purple-100 text-purple-600",
  },
  {
    title: "메신저",
    description: "팀원과 빠른 소통",
    href: "/messenger",
    icon: Send,
    iconArea: "bg-teal-100 text-teal-600",
  },
  {
    title: "음성 회의",
    description: "회의록 자동 변환",
    href: "/voice",
    icon: Mic,
    iconArea: "bg-destructive/10 text-destructive",
  },
];

export default function HomePage() {
  const { openMessenger } = useMessenger();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 lg:gap-12 items-start pb-10">
      {/* 1. LEFT PANE (75% on Desktop) */}
      <div className="xl:col-span-3 flex flex-col gap-10 lg:gap-14">
        {/* DASHBOARD SHORTCUTS GRID (2-Column Layout for wider, premium cards) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {DASHBOARD_SHORTCUTS.map((shortcut) => {
            const isMessenger = shortcut.href === "/messenger";
            const isSpecial = shortcut.title === "AI 비서"; // Special styling for Curator Pro reference
            
            return (
              <Link
                key={shortcut.title}
                href={isMessenger ? "#" : shortcut.href}
                onClick={(e) => {
                  if (isMessenger) {
                    e.preventDefault();
                    openMessenger();
                  }
                }}
                className={cn(
                  "group relative flex flex-col gap-4 rounded-[24px] p-5 md:p-6 transition-all hover:-translate-y-1",
                  isSpecial
                    ? "bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-background/60 hover:shadow-md"
                    : "bg-surface-muted/60 border border-transparent hover:bg-surface-muted"
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] shadow-sm transition-transform group-hover:scale-110",
                      shortcut.iconArea
                    )}
                  >
                    <shortcut.icon className="h-5 w-5" />
                  </div>
                  
                  {isSpecial ? (
                    <div className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wider shadow-sm absolute -top-1 right-5 md:top-5 md:-translate-y-1">
                      인기
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-5 w-5 text-text-muted/40 group-hover:text-primary transition-all" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 mt-2">
                  <h2 className="font-headings text-[17px] font-bold text-text group-hover:text-primary transition-colors leading-tight">
                    {shortcut.title}
                  </h2>
                  <p className="text-[13px] font-medium text-text-muted/70 leading-relaxed min-h-[2.5rem]">
                    {shortcut.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>

        {/* MAIN WORKSPACE (Schedules) */}
        <section>
          <HomeCalendarWidget />
        </section>
      </div>

      {/* 2. RIGHT SIDEBAR PANE (25% on Desktop) */}
      <div className="xl:col-span-1 flex flex-col gap-10 lg:gap-14">
        {/* Section: Recommended Tasks (Image 1 Style) */}
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl font-headings font-bold text-text px-1">
            지금 하면 좋은 작업
          </h3>
          
          <div className="flex flex-col gap-4">
              {[
                { icon: CircleAlert, title: "대기 중인 편집 검토", desc: "3개의 파일이 승인을 기다리고 있습니다.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                { icon: Mail, title: "주간 리포트", desc: "팀 활동 요약 정보입니다.", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                { icon: FolderArchive, title: "프로젝트 알파 아카이브", desc: "14일 전에 완료된 프로젝트입니다.", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-500/10" },
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-5 py-3 bg-transparent cursor-pointer group">
                  <div className={cn("h-11 w-11 shrink-0 flex items-center justify-center rounded-full shadow-sm", task.bg)}>
                    <task.icon className={cn("h-5 w-5", task.color)} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h4 className="text-[15px] font-bold text-text group-hover:text-primary transition-colors truncate">{task.title}</h4>
                    <p className="text-[13px] font-medium text-text-muted mt-0.5 leading-snug">{task.desc}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <UserProgressCard />
        
        <div className="sticky top-24">
          <EmbeddedAiWidget />
        </div>
      </div>
    </div>
  );
}
