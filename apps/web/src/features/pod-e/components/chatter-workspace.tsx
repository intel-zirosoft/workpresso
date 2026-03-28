"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  MessageSquareText,
  Search,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  ChatterChannelDetail,
  ChatterChannelSummary,
  ChatterLinkCard,
  ChatterMemberStatus,
  ChatterMemberSummary,
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

const channelTypeLabel: Record<ChatterChannelSummary["type"], string> = {
  ANNOUNCEMENT: "공지",
  DEPARTMENT: "부서",
  PROJECT: "프로젝트",
  DM: "개인",
};

const statusTone: Record<ChatterMemberStatus, string> = {
  ACTIVE: "bg-success text-text",
  MEETING: "bg-secondary text-text",
  VACATION: "bg-primary/20 text-text",
  OFFLINE: "bg-muted/20 text-muted",
};

const statusLabel: Record<ChatterMemberStatus, string> = {
  ACTIVE: "업무 가능",
  MEETING: "회의 중",
  VACATION: "자리 비움",
  OFFLINE: "오프라인",
};

const linkIcon = {
  문서: FileText,
  일정: CalendarDays,
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

function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatChannelActivity(iso: string | null) {
  if (!iso) {
    return "방금 생성됨";
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

function MessageBubble({ message }: { message: ChatterMessageSummary }) {
  return (
    <div
      className={cn(
        "flex w-full gap-3",
        message.isMine ? "justify-end" : "justify-start"
      )}
    >
      {!message.isMine && (
        <Avatar className="mt-1 h-10 w-10 shadow-soft">
          <AvatarFallback className="bg-secondary/30 text-text font-headings">
            {message.authorName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[86%] space-y-2 md:max-w-[72%]">
        <div
          className={cn(
            "rounded-[24px] px-5 py-4 shadow-soft transition-transform duration-300",
            message.isMine
              ? "rounded-br-[8px] bg-primary text-white"
              : "rounded-tl-[8px] bg-white text-text"
          )}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-headings text-sm font-semibold",
                message.isMine ? "text-white/90" : "text-text"
              )}
            >
              {message.authorName}
            </span>
            <span
              className={cn(
                "text-xs font-body",
                message.isMine ? "text-white/70" : "text-muted"
              )}
            >
              {message.authorRole}
            </span>
          </div>

          {message.content ? (
            <p
              className={cn(
                "whitespace-pre-wrap text-[15px] leading-6",
                message.isMine ? "text-white" : "text-text"
              )}
            >
              {message.content}
            </p>
          ) : null}

          {message.links.length > 0 ? (
            <div className={cn(message.content ? "mt-4 space-y-2" : "space-y-2")}>
              {message.links.map((item) => (
                <LinkCard item={item} key={item.id} muted={message.isMine} />
              ))}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "px-2 text-xs font-body text-muted",
            message.isMine ? "text-right" : "text-left"
          )}
        >
          {formatTimeLabel(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function LinkCard({ item, muted = false }: { item: ChatterLinkCard; muted?: boolean }) {
  const Icon = linkIcon[item.kind];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] border border-transparent px-4 py-3",
        muted ? "bg-white/12" : "bg-background/80"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md",
          muted ? "bg-white/15" : "bg-primary/10"
        )}
      >
        <Icon className={cn("h-5 w-5", muted ? "text-white" : "text-primary")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-headings text-sm font-semibold", muted ? "text-white" : "text-text")}>
          {item.label}
        </p>
        <p className={cn("truncate text-xs font-body", muted ? "text-white/75" : "text-muted")}>
          {item.kind} · {item.meta}
        </p>
      </div>
    </div>
  );
}

function MemberListItem({ member }: { member: ChatterMemberSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-background/60 px-3 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 font-headings text-sm font-semibold text-text">
        {member.name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-headings text-sm font-semibold text-text">
            {member.name}
          </p>
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 text-[10px] font-bold",
              statusTone[member.status]
            )}
          >
            {statusLabel[member.status]}
          </span>
        </div>
        <p className="truncate text-xs text-muted">
          {member.role} · {member.department}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className={cn("rounded-[24px] px-4 py-3 shadow-soft", tone)}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text/65">
        {label}
      </p>
      <p className="mt-2 text-2xl font-headings font-bold text-text">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-primary/20 bg-white/70 px-6 py-10 text-center shadow-soft">
      <p className="font-headings text-lg font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export function ChatterWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeChannelId, setActiveChannelId] = useState("");
  const [draft, setDraft] = useState("");
  const deferredSearch = useDeferredValue(search);

  const channelsQuery = useQuery({
    queryKey: ["chatter", "channels"],
    queryFn: fetchChannels,
  });

  const channels = channelsQuery.data?.channels ?? [];

  const filteredChannels = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    if (!normalized) {
      return channels;
    }

    return channels.filter((channel) => {
      return (
        channel.name.toLowerCase().includes(normalized) ||
        channel.description.toLowerCase().includes(normalized) ||
        channel.lastMessagePreview.toLowerCase().includes(normalized)
      );
    });
  }, [channels, deferredSearch]);

  useEffect(() => {
    if (!channels.length) {
      setActiveChannelId("");
      return;
    }

    const hasActiveChannel = channels.some((channel) => channel.id === activeChannelId);
    if (!activeChannelId || !hasActiveChannel) {
      setActiveChannelId(channels[0].id);
    }
  }, [activeChannelId, channels]);

  const activeChannelSummary =
    channels.find((channel) => channel.id === activeChannelId) ?? filteredChannels[0] ?? null;

  const channelQuery = useQuery({
    queryKey: ["chatter", "channel", activeChannelId],
    queryFn: () => fetchChannelMessages(activeChannelId),
    enabled: Boolean(activeChannelId),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: CreateMessagePayload) => createMessage(activeChannelId, payload),
    onSuccess: async () => {
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chatter", "channels"] }),
        queryClient.invalidateQueries({ queryKey: ["chatter", "channel", activeChannelId] }),
      ]);
    },
  });

  const handleSend = () => {
    if (!draft.trim() || !activeChannelId || sendMutation.isPending) {
      return;
    }

    sendMutation.mutate({ content: draft.trim() });
  };

  const handleShareTarget = (target: ChatterShareTarget) => {
    if (!activeChannelId || sendMutation.isPending) {
      return;
    }

    sendMutation.mutate({
      content: draft.trim(),
      linkedObject: {
        type: target.type,
        id: target.id,
      },
    });
  };

  const channelDetail = channelQuery.data?.channel ?? null;
  const messages = channelQuery.data?.messages ?? [];
  const shareTargets = channelQuery.data?.shareTargets ?? { documents: [], schedules: [] };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 rounded-[32px] bg-[linear-gradient(135deg,rgba(127,161,195,0.18),rgba(242,193,141,0.18),rgba(255,255,255,0.9))] px-6 py-6 shadow-soft md:flex-row md:items-end md:justify-between md:px-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-pill bg-white/80 px-3 py-1 text-xs font-bold text-primary shadow-soft">
            <Sparkles className="h-4 w-4" />
            업무 맥락이 남는 그룹웨어 채널
          </div>
          <h1 className="text-3xl font-headings font-bold text-text tracking-tight md:text-4xl">
            채터
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-text/80 md:text-base">
            MVP는 채널 기반 텍스트 대화와 업무 링크 공유에 집중합니다. 채널 멤버십 안에서만 메시지를 보고 남길 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="활성 채널" value={String(channels.length)} tone="bg-primary/12" />
          <MetricCard
            label="채널 멤버"
            value={String(channelDetail?.members.length ?? activeChannelSummary?.memberCount ?? 0)}
            tone="bg-secondary/20"
          />
          <MetricCard
            label="공유 링크"
            value={String(channelDetail?.sharedItems.length ?? 0)}
            tone="bg-success/20"
          />
          <MetricCard label="보안 정책" value="ON" tone="bg-white/70" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-transparent bg-surface shadow-soft">
          <div className="border-b border-background/70 px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                  Channel Desk
                </p>
                <h2 className="mt-1 text-xl font-headings font-bold text-text">
                  내 채널
                </h2>
              </div>
              <Button
                className="rounded-pill bg-primary px-4 text-white shadow-soft hover:bg-primary/90"
                disabled
              >
                MVP 범위
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="채널, 설명, 최근 메시지 검색"
                className="h-12 rounded-pill border-transparent bg-background pl-11 shadow-inner focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2 p-3">
            {channelsQuery.isLoading ? (
              <div className="flex min-h-40 items-center justify-center text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredChannels.length > 0 ? (
              filteredChannels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                return (
                  <button
                    className={cn(
                      "w-full rounded-[24px] px-4 py-4 text-left transition-all duration-300",
                      isActive
                        ? "bg-primary text-white shadow-float"
                        : "bg-transparent hover:bg-background/80"
                    )}
                    key={channel.id}
                    onClick={() => setActiveChannelId(channel.id)}
                    type="button"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full",
                            isActive ? "bg-white/20" : "bg-primary/10"
                          )}
                        >
                          {channel.type === "DM" ? (
                            <MessageSquareText className={cn("h-4 w-4", isActive ? "text-white" : "text-primary")} />
                          ) : (
                            <Hash className={cn("h-4 w-4", isActive ? "text-white" : "text-primary")} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-headings text-sm font-semibold">
                            {channel.name}
                          </p>
                          <p className={cn("text-xs", isActive ? "text-white/75" : "text-muted")}>
                            {channelTypeLabel[channel.type]} · 멤버 {channel.memberCount}
                          </p>
                        </div>
                      </div>

                      {channel.unreadCount > 0 ? (
                        <span
                          className={cn(
                            "rounded-pill px-2 py-1 text-[10px] font-bold",
                            isActive ? "bg-white text-primary" : "bg-primary text-white"
                          )}
                        >
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </div>

                    <p className={cn("line-clamp-2 text-sm leading-5", isActive ? "text-white/80" : "text-muted")}>
                      {channel.lastMessagePreview}
                    </p>
                    <p className={cn("mt-3 text-xs font-medium", isActive ? "text-white/70" : "text-muted")}>
                      {formatChannelActivity(channel.lastActivityAt)}
                    </p>
                  </button>
                );
              })
            ) : (
              <EmptyState
                title="표시할 채널이 없습니다."
                description="현재 계정이 속한 채널 멤버십이 없거나 아직 채널 데이터가 준비되지 않았습니다."
              />
            )}
          </div>
        </Card>

        <Card className="flex min-h-[720px] flex-col overflow-hidden border-transparent bg-surface shadow-soft">
          <div className="border-b border-background/70 bg-[linear-gradient(180deg,rgba(253,251,247,0.96),rgba(255,255,255,0.96))] px-5 py-5 md:px-7">
            {activeChannelSummary ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-headings font-bold text-text">
                      {channelDetail?.name ?? activeChannelSummary.name}
                    </h2>
                    <Badge className="rounded-pill bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                      {channelTypeLabel[activeChannelSummary.type]}
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-muted">
                    {channelDetail?.description ?? activeChannelSummary.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="rounded-pill border-transparent bg-background px-4 shadow-soft">
                    <Users className="h-4 w-4 text-primary" />
                    멤버 {channelDetail?.members.length ?? activeChannelSummary.memberCount}
                  </Button>
                  <Button variant="outline" className="rounded-pill border-transparent bg-background px-4 shadow-soft" disabled>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    MVP 권한 정책
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="채널을 선택해 주세요."
                description="좌측에서 접근 가능한 채널을 선택하면 메시지와 멤버 정보를 불러옵니다."
              />
            )}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(127,161,195,0.08),transparent_30%)] px-4 py-5 md:px-6">
            {channelQuery.isLoading ? (
              <div className="flex min-h-48 items-center justify-center text-muted">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : channelQuery.isError ? (
              <EmptyState
                title="메시지를 불러오지 못했습니다."
                description={channelQuery.error instanceof Error ? channelQuery.error.message : "잠시 후 다시 시도해 주세요."}
              />
            ) : messages.length > 0 ? (
              messages.map((message) => <MessageBubble key={message.id} message={message} />)
            ) : activeChannelSummary ? (
              <EmptyState
                title="아직 메시지가 없습니다."
                description="이 채널의 첫 메시지를 남겨 대화를 시작하거나 아래 공유 버튼으로 업무 객체를 연결해 보세요."
              />
            ) : null}
          </div>

          <div className="border-t border-background/70 bg-white/90 px-4 py-4 md:px-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {shareTargets.documents.slice(0, 1).map((target) => (
                <button
                  className="rounded-pill bg-background px-3 py-1.5 text-xs font-bold text-text transition-colors hover:bg-primary/10"
                  key={target.id}
                  onClick={() => handleShareTarget(target)}
                  type="button"
                >
                  /문서 {target.label}
                </button>
              ))}
              {shareTargets.schedules.slice(0, 1).map((target) => (
                <button
                  className="rounded-pill bg-background px-3 py-1.5 text-xs font-bold text-text transition-colors hover:bg-primary/10"
                  key={target.id}
                  onClick={() => handleShareTarget(target)}
                  type="button"
                >
                  /일정 {target.label}
                </button>
              ))}
              {!shareTargets.documents.length && !shareTargets.schedules.length ? (
                <span className="rounded-pill bg-background px-3 py-1.5 text-xs font-bold text-muted">
                  공유 가능한 문서/일정이 아직 없습니다.
                </span>
              ) : null}
            </div>

            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  className="min-h-[112px] w-full resize-none rounded-[28px] border border-transparent bg-background px-5 py-4 pr-16 text-[15px] leading-6 text-text shadow-inner outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/40"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="팀과 공유할 내용을 입력하세요. 문서나 일정 링크를 함께 남기면 맥락이 더 잘 보입니다."
                  value={draft}
                />
                <button
                  className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform hover:scale-105 disabled:bg-muted disabled:text-white"
                  disabled={!draft.trim() || !activeChannelId || sendMutation.isPending}
                  onClick={handleSend}
                  type="button"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <p>비멤버는 채널과 메시지에 접근할 수 없습니다.</p>
              <p>문서와 일정은 현재 로그인한 사용자 소유 데이터만 공유됩니다.</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-transparent bg-surface p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-headings font-bold text-text">
                채널 컨텍스트
              </h3>
            </div>
            <div className="space-y-3">
              {channelDetail?.members.length ? (
                channelDetail.members.map((member) => (
                  <MemberListItem key={`${channelDetail.id}-${member.id}`} member={member} />
                ))
              ) : (
                <EmptyState
                  title="멤버 정보를 기다리는 중입니다."
                  description="채널을 선택하면 멤버와 상태 정보를 함께 보여줍니다."
                />
              )}
            </div>
          </Card>

          <Card className="border-transparent bg-surface p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-headings font-bold text-text">
                업무 링크
              </h3>
            </div>
            <div className="space-y-3">
              {channelDetail?.sharedItems.length ? (
                channelDetail.sharedItems.map((item) => (
                  <LinkCard item={item} key={`${channelDetail.id}-${item.id}`} />
                ))
              ) : (
                <EmptyState
                  title="공유된 업무 링크가 없습니다."
                  description="문서나 일정 공유 버튼을 눌러 이 채널의 첫 업무 맥락을 남길 수 있습니다."
                />
              )}
            </div>
          </Card>

          <Card className="border-transparent bg-[linear-gradient(180deg,rgba(127,161,195,0.12),rgba(255,255,255,0.95))] p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-headings font-bold text-text">
                그룹웨어 가드레일
              </h3>
            </div>
            <div className="space-y-3 text-sm leading-6 text-text/85">
              <p>채널 접근은 멤버십 또는 소유자 권한으로만 허용됩니다.</p>
              <p>MVP에서는 텍스트 메시지와 문서/일정 링크만 지원하며 첨부와 외부 공개 링크는 제외합니다.</p>
              <p>링크 공유는 현재 로그인한 사용자 소유 객체로 한정해 권한 범위를 좁힙니다.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
