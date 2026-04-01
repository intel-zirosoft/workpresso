"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Hash,
  Loader2,
  MessageSquareText,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ChatterChannelDetail,
  ChatterChannelSummary,
  ChatterMessageSummary,
  ChatterShareTarget,
} from "@/features/pod-e/services/chatter-types";

type ChannelListResponse = {
  channels: ChatterChannelSummary[];
};

type ChannelMessagesResponse = {
  channel: ChatterChannelDetail;
  messages: ChatterMessageSummary[];
  shareTargets: {
    documents: ChatterShareTarget[];
    schedules: ChatterShareTarget[];
  };
};

type CreateMessagePayload = {
  content?: string;
  linkedObject?: {
    type: "DOCUMENT" | "SCHEDULE";
    id: string;
  };
};

async function fetchChannels() {
  const response = await fetch("/api/chatter/channels");
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "채널 목록을 불러오지 못했습니다.");
  }

  return payload as ChannelListResponse;
}

async function fetchChannelMessages(channelId: string) {
  const response = await fetch(`/api/chatter/channels/${channelId}/messages`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "채널 메시지를 불러오지 못했습니다.");
  }

  return payload as ChannelMessagesResponse;
}

async function createMessage(channelId: string, payload: CreateMessagePayload) {
  const response = await fetch(`/api/chatter/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "메시지를 저장하지 못했습니다.");
  }

  return data;
}

function formatActivityLabel(iso: string | null) {
  if (!iso) {
    return "새 채널";
  }

  const date = new Date(iso);
  const now = new Date();
  const diffMinutes = Math.round((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

type MobileChatterWorkspaceProps = {
  initialView?: "all" | "inbox";
};

export function MobileChatterWorkspace({
  initialView = "inbox",
}: MobileChatterWorkspaceProps) {
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState("");
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"all" | "inbox">(initialView);

  const channelsQuery = useQuery({
    queryKey: ["chatter", "channels"],
    queryFn: fetchChannels,
  });

  const channels = channelsQuery.data?.channels ?? [];

  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }

      return (
        new Date(b.lastActivityAt ?? 0).getTime() -
        new Date(a.lastActivityAt ?? 0).getTime()
      );
    });
  }, [channels]);

  const unreadChannels = useMemo(
    () => sortedChannels.filter((channel) => channel.unreadCount > 0),
    [sortedChannels],
  );

  const visibleChannels = view === "inbox" ? unreadChannels : sortedChannels;
  const fallbackChannels = visibleChannels.length > 0 ? visibleChannels : sortedChannels;

  useEffect(() => {
    if (!fallbackChannels.length) {
      setActiveChannelId("");
      return;
    }

    if (!fallbackChannels.some((channel) => channel.id === activeChannelId)) {
      setActiveChannelId(fallbackChannels[0].id);
    }
  }, [activeChannelId, fallbackChannels]);

  const activeChannel =
    sortedChannels.find((channel) => channel.id === activeChannelId) ??
    fallbackChannels[0] ??
    null;

  const channelQuery = useQuery({
    queryKey: ["chatter", "channel", activeChannel?.id],
    queryFn: () => fetchChannelMessages(activeChannel!.id),
    enabled: Boolean(activeChannel?.id),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: CreateMessagePayload) =>
      createMessage(activeChannel!.id, payload),
    onSuccess: async () => {
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chatter", "channels"] }),
        queryClient.invalidateQueries({
          queryKey: ["chatter", "channel", activeChannel?.id],
        }),
      ]);
    },
  });

  const unreadChannelCount = unreadChannels.length;
  const totalUnreadCount = sortedChannels.reduce(
    (sum, channel) => sum + channel.unreadCount,
    0,
  );
  const messages = channelQuery.data?.messages ?? [];
  const detail = channelQuery.data?.channel ?? null;

  const handleSend = () => {
    if (!activeChannel?.id || !draft.trim() || sendMutation.isPending) {
      return;
    }

    sendMutation.mutate({ content: draft.trim() });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
          Mobile Chatter
        </p>
        <h1 className="mt-2 font-headings text-[26px] font-bold leading-tight">
          읽지 않은 대화부터 빠르게 확인하세요.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          앱에서는 복잡한 메신저 툴바 대신 읽지 않은 채널, 최근 브리핑, 빠른
          답장을 우선 보여줍니다.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              읽지 않은 채널
            </p>
            <p className="mt-2 text-2xl font-headings font-bold">
              {unreadChannelCount}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              안 읽은 메시지
            </p>
            <p className="mt-2 text-2xl font-headings font-bold">
              {totalUnreadCount}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
              빠른 답장
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
              채널 선택 후 바로 전송
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headings text-lg font-bold text-text">
              받은 편지함
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              읽지 않은 대화와 중요한 채널이 위에 정렬됩니다.
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
          {channelsQuery.isLoading ? (
            <div className="flex min-h-28 items-center justify-center text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : channelsQuery.isError ? (
            <div className="rounded-[22px] border border-warning/20 bg-warning-soft px-4 py-4 text-sm text-text">
              {(channelsQuery.error as Error).message}
            </div>
          ) : fallbackChannels.length > 0 ? (
            fallbackChannels.map((channel) => {
              const isActive = channel.id === activeChannel?.id;

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setActiveChannelId(channel.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition-all",
                    isActive
                      ? "border-primary/20 bg-primary/5 shadow-soft"
                      : "border-background/70 bg-background/30",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      channel.unreadCount > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-text-muted",
                    )}
                  >
                    {channel.unreadCount > 0 ? (
                      <BellRing className="h-5 w-5" />
                    ) : (
                      <Hash className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-headings text-base font-bold text-text">
                          {channel.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-text-muted">
                          {formatActivityLabel(channel.lastActivityAt)}
                        </p>
                      </div>
                      {channel.unreadCount > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-muted">
                      {channel.lastMessagePreview || channel.description}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-background/80 bg-background/30 px-4 py-8 text-center">
              <p className="font-headings text-base font-bold text-text">
                읽지 않은 대화가 없습니다
              </p>
              <p className="mt-2 text-sm text-text-muted">
                전체 보기를 눌러 최근 채널을 확인해 보세요.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-background/60 bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
              빠른 확인
            </p>
            <h2 className="mt-1 truncate font-headings text-xl font-bold text-text">
              {detail?.name ?? activeChannel?.name ?? "채널을 선택하세요"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {detail?.description ??
                activeChannel?.description ??
                "읽지 않은 대화를 먼저 고르고 최근 메시지를 확인할 수 있습니다."}
            </p>
          </div>

          <div className="rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
            {detail?.members.length ?? 0}명 참여
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-text-muted">
            읽지 않은 채널 {unreadChannelCount}개
          </span>
          <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-text-muted">
            최근 브리핑 {messages.length}건
          </span>
          <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-text-muted">
            빠른 답장 사용 가능
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {channelQuery.isLoading ? (
            <div className="flex min-h-24 items-center justify-center text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : channelQuery.isError ? (
            <div className="rounded-[22px] border border-warning/20 bg-warning-soft px-4 py-4 text-sm text-text">
              {(channelQuery.error as Error).message}
            </div>
          ) : messages.length > 0 ? (
            messages.slice(-6).map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 rounded-[22px] px-3 py-3",
                  message.isMine ? "bg-primary/5" : "bg-background/40",
                )}
              >
                <Avatar className="h-10 w-10 rounded-2xl">
                  <AvatarFallback className="bg-primary/10 font-headings font-bold text-primary">
                    {message.authorName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-text">
                      {message.authorName}
                    </p>
                    <span className="text-[11px] text-text-muted">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text/90">
                    {message.content || "공유된 항목이 있습니다."}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-background/80 bg-background/30 px-4 py-8 text-center">
              <p className="font-headings text-base font-bold text-text">
                최근 메시지가 없습니다
              </p>
              <p className="mt-2 text-sm text-text-muted">
                이 채널에서 첫 대화를 시작해 보세요.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[24px] border border-background/80 bg-background/40 p-3">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              빠른 답장
            </p>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              activeChannel
                ? `${activeChannel.name}에 짧게 답장하기`
                : "채널을 선택한 뒤 답장을 작성하세요."
            }
            className="min-h-[96px] w-full resize-none rounded-[20px] border border-background bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              긴 작성보다 확인과 짧은 응답에 맞춘 모바일 입력창입니다.
            </p>
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || !activeChannel || sendMutation.isPending}
              className="rounded-full px-5"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  보내기
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] bg-primary/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headings text-base font-bold text-text">
                최근 브리핑 위주로 확인
              </p>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                앱에서는 분석, 라이브러리, 멤버 패널보다 읽지 않은 채널과 최근
                메시지 확인이 먼저 보이도록 구성했습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
