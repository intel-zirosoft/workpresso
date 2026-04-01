"use client";

import { useMemo, useState } from "react";
import { BellRing, Hash, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileChatterWorkspaceProps = {
  initialView?: "all" | "inbox";
};

type DummyChannel = {
  id: string;
  name: string;
  preview: string;
  activity: string;
  unreadCount: number;
};

type DummyMessage = {
  id: string;
  author: string;
  time: string;
  content: string;
  isMine?: boolean;
};

const DUMMY_CHANNELS: DummyChannel[] = [
  {
    id: "design",
    name: "디자인 협업",
    preview: "시안 확인 후 의견만 간단히 남겨주세요.",
    activity: "10분 전",
    unreadCount: 2,
  },
  {
    id: "notice",
    name: "공지 공유",
    preview: "오늘 배포 일정은 오후 4시로 정리되었습니다.",
    activity: "30분 전",
    unreadCount: 1,
  },
  {
    id: "team",
    name: "운영 팀",
    preview: "내일 오전 브리핑 자료만 다시 확인하면 됩니다.",
    activity: "1시간 전",
    unreadCount: 0,
  },
];

const DUMMY_MESSAGES: Record<string, DummyMessage[]> = {
  design: [
    {
      id: "design-1",
      author: "한나",
      time: "오전 09:20",
      content: "모바일에서는 설명보다 확인이 먼저 보이도록 정리해 두었습니다.",
    },
    {
      id: "design-2",
      author: "나",
      time: "오전 09:24",
      content: "좋아요. 카드 간격만 조금 더 줄여서 확인 중심으로 가면 될 것 같습니다.",
      isMine: true,
    },
  ],
  notice: [
    {
      id: "notice-1",
      author: "운영봇",
      time: "오전 08:50",
      content: "오늘 주요 공지와 승인 대기 항목은 홈 브리핑에서 먼저 확인할 수 있습니다.",
    },
  ],
  team: [
    {
      id: "team-1",
      author: "민수",
      time: "어제",
      content: "앱에서는 핵심 확인만 빠르게 할 수 있게 최소 구성으로 유지합니다.",
    },
  ],
};

export function MobileChatterWorkspace({
  initialView = "inbox",
}: MobileChatterWorkspaceProps) {
  const [view, setView] = useState<"all" | "inbox">(initialView);
  const visibleChannels = useMemo(() => {
    return view === "inbox"
      ? DUMMY_CHANNELS.filter((channel) => channel.unreadCount > 0)
      : DUMMY_CHANNELS;
  }, [view]);

  const channels = visibleChannels.length > 0 ? visibleChannels : DUMMY_CHANNELS;
  const activeChannel = channels[0];
  const messages = DUMMY_MESSAGES[activeChannel.id] ?? [];
  const totalUnreadCount = DUMMY_CHANNELS.reduce(
    (sum, channel) => sum + channel.unreadCount,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="rounded-[28px] border border-background/60 bg-surface px-5 py-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
              Messenger
            </p>
            <h1 className="mt-2 font-headings text-[23px] font-bold leading-tight text-text">
              짧게 확인하고 바로 끝내는 메신저
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              현재 메신저 기능은 준비 중이며, 앱에서는 확인 중심의 더미 UI만 먼저 제공합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
            데모 화면
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-background/45 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
              읽지 않은 대화
            </p>
            <p className="mt-2 text-2xl font-headings font-bold text-text">
              {DUMMY_CHANNELS.filter((channel) => channel.unreadCount > 0).length}
            </p>
          </div>
          <div className="rounded-[22px] bg-background/45 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
              안 읽은 메시지
            </p>
            <p className="mt-2 text-2xl font-headings font-bold text-text">
              {totalUnreadCount}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headings text-lg font-bold text-text">대화 목록</h2>
            <p className="mt-1 text-sm text-text-muted">
              실제 채널 연결 전, 모바일용 간소 레이아웃만 우선 반영했습니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background/70 p-1">
            <button
              type="button"
              onClick={() => setView("inbox")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                view === "inbox"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-muted",
              )}
            >
              읽지 않음
            </button>
            <button
              type="button"
              onClick={() => setView("all")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                view === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-muted",
              )}
            >
              전체
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {channels.map((channel, index) => {
            const isActive = index === 0;

            return (
              <div
                key={channel.id}
                className={cn(
                  "flex items-start gap-3 rounded-[22px] border px-4 py-4",
                  isActive
                    ? "border-primary/20 bg-primary/5"
                    : "border-background/70 bg-background/30",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                    channel.unreadCount > 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-text-muted",
                  )}
                >
                  {channel.unreadCount > 0 ? (
                    <BellRing className="h-4 w-4" />
                  ) : (
                    <Hash className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-headings text-base font-bold text-text">
                        {channel.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-text-muted">
                        {channel.activity}
                      </p>
                    </div>
                    {channel.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
                        {channel.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm text-text-muted">
                    {channel.preview}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
              현재 대화
            </p>
            <h2 className="mt-1 truncate font-headings text-xl font-bold text-text">
              {activeChannel.name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              실제 메시지 동기화 전, 모바일 미리보기 더미만 표시합니다.
            </p>
          </div>
          <div className="rounded-full bg-background px-3 py-1.5 text-xs font-bold text-text-muted">
            미리보기
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 rounded-[22px] px-3 py-3",
                message.isMine ? "bg-primary/5" : "bg-background/40",
              )}
            >
              <Avatar className="h-9 w-9 rounded-2xl">
                <AvatarFallback className="bg-primary/10 font-headings font-bold text-primary">
                  {message.author.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-text">
                    {message.author}
                  </p>
                  <span className="text-[11px] text-text-muted">{message.time}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text/90">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-dashed border-background/80 bg-background/30 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
            빠른 답장
          </p>
          <div className="mt-3 rounded-[20px] border border-background bg-surface px-4 py-4 text-sm text-text-muted">
            메시지 입력 기능은 추후 연결 예정입니다.
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              지금은 모바일 UI 흐름만 확인할 수 있습니다.
            </p>
            <Button disabled className="rounded-full px-5 opacity-100">
              <SendHorizontal className="mr-2 h-4 w-4" />
              준비 중
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
