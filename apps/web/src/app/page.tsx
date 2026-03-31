

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  FileText,
  MessageSquare,
  Mic,
  Plus,
  Users,
} from "lucide-react";
import { CalendarView } from "@/app/(schedules)/_components/calendar-view";
import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  {
    title: "문서 초안 만들기",
    description: "결재 문서나 공유 문서를 바로 작성해보세요.",
    href: "/documents",
    icon: FileText,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "오늘 일정 정리",
    description: "회의와 업무 시간을 빠르게 확인하고 수정하세요.",
    href: "/schedules",
    icon: CalendarPlus,
    tone: "bg-secondary/20 text-text",
  },
  {
    title: "AI에게 물어보기",
    description: "해야 할 일을 정리하거나 문서를 요약받을 수 있어요.",
    href: "/chat",
    icon: Bot,
    tone: "bg-success/10 text-text",
  },
  {
    title: "팀 상태 확인",
    description: "누가 회의 중인지, 재택인지 한눈에 파악하세요.",
    href: "/teammates",
    icon: Users,
    tone: "bg-primary/10 text-primary",
  },
];

const START_GUIDE = [
  {
    title: "가장 먼저 일정 확인",
    description:
      "오늘 일정이 비어 있으면 우선 해야 할 일부터 시간 블록을 잡아두세요.",
  },
  {
    title: "문서와 대화 분리",
    description:
      "정리할 내용은 문서로, 빠른 소통은 채터로 나누면 찾기 쉬워집니다.",
  },
  {
    title: "막히면 AI 활용",
    description:
      "초안 작성, 요약, 다음 액션 정리부터 AI에게 맡기면 시작 비용이 줄어듭니다.",
  },
];

const COLLABORATION_LINKS = [
  {
    title: "채터로 빠르게 공유",
    description: "짧은 진행 상황이나 확인 요청을 즉시 전달하세요.",
    href: "/chatter",
    icon: MessageSquare,
  },
  {
    title: "음성 회의록 남기기",
    description: "회의 직후 녹음과 요약을 남겨 후속 작업 누락을 줄이세요.",
    href: "/voice",
    icon: Mic,
  },
  {
    title: "팀 상태 보드 보기",
    description: "회의·재택·외근 상태를 보고 협업 타이밍을 조절하세요.",
    href: "/teammates",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-10">
      <header className="overflow-hidden rounded-[28px] border border-background/60 bg-surface px-5 py-6 shadow-soft md:px-8 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              오늘의 워크스페이스
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-headings font-bold tracking-tight text-text md:text-4xl">
                해야 할 일을 바로 시작할 수 있게 준비했어요.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted md:text-base">
                일정 확인, 문서 작성, AI 질문, 팀 협업까지 자주 쓰는 흐름을
                홈에서 바로 이어갈 수 있도록 정리했습니다.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Button
              asChild
              className="h-12 rounded-pill px-6 text-sm font-bold shadow-soft"
            >
              <Link href="/documents">
                <Plus className="h-4 w-4" />
                문서 작성 시작
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-pill border-background/70 bg-surface px-6 text-sm font-bold text-text hover:bg-background"
            >
              <Link href="/chat">
                <Bot className="h-4 w-4" />
                AI에게 질문
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-[24px] border border-background/60 bg-background/40 p-4 transition-all hover:-translate-y-1 hover:bg-surface hover:shadow-soft"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${action.tone}`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-headings text-base font-bold text-text">
                    {action.title}
                  </h2>
                  <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="text-sm leading-5 text-text-muted">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2 md:space-y-8">
          <section className="rounded-[28px] border border-background/60 bg-surface p-5 shadow-soft md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-primary">오늘 추천 동선</p>
                <h2 className="mt-1 font-headings text-2xl font-bold text-text">
                  일정부터 확인하고 바로 실행해보세요.
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="h-10 justify-start rounded-pill px-0 text-sm font-bold text-primary hover:bg-transparent hover:text-primary/80"
              >
                <Link href="/schedules">
                  일정 전체 보기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {START_GUIDE.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[24px] bg-background/50 p-4"
                >
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-black text-primary shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-headings text-base font-bold text-text">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-text-muted">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-background/60 bg-surface p-5 shadow-soft md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headings text-2xl font-bold text-text">
                  내 일정 한눈에 보기
                </h2>
                <p className="mt-1 text-sm text-muted">
                  날짜를 눌러 일정을 확인하고, 필요한 경우 바로 추가할 수
                  있어요.
                </p>
              </div>
            </div>
            <CalendarView variant="default" />
          </section>
        </div>

        <div className="space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-background/60 bg-surface p-5 shadow-soft md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h2 className="font-headings text-xl font-bold text-text">
                지금 하면 좋은 작업
              </h2>
            </div>

            <div className="space-y-3">
              {COLLABORATION_LINKS.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group block rounded-[22px] border border-background/60 bg-background/35 p-4 transition-all hover:bg-surface hover:shadow-soft"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-headings text-base font-bold text-text">
                          {item.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mt-1 text-sm leading-5 text-text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-success/20 bg-success/10 p-5 shadow-sm md:p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-bold text-text">
              <Bot className="h-3.5 w-3.5 text-primary" />
              빠른 시작 팁
            </div>
            <h2 className="font-headings text-xl font-bold text-text">
              막히면 이렇게 물어보세요
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text/80">
              <li>• “오늘 일정 기준으로 우선순위를 정리해줘”</li>
              <li>• “회의록 초안을 3줄로 요약해줘”</li>
              <li>• “공유용 문서 목차를 먼저 만들어줘”</li>
            </ul>
            <Button
              asChild
              variant="ghost"
              className="mt-4 h-10 rounded-pill bg-surface/80 px-4 text-sm font-bold text-primary hover:bg-surface"
            >
              <Link href="/chat">
                AI 채팅 열기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
