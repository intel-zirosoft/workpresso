"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Clock3,
  FileText,
  Hash,
  Home,
  Info,
  Library,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquareText,
  MoreVertical,
  Pin,
  Plus,
  PlusCircle,
  Search,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
  AtSign,
  type LucideIcon,
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

const channelTypeIcon: Record<ChatterChannelSummary["type"], LucideIcon> = {
  ANNOUNCEMENT: Hash,
  DEPARTMENT: Hash,
  PROJECT: Hash,
  DM: MessageSquareText,
};

const statusTone: Record<ChatterMemberStatus, string> = {
  ACTIVE: "bg-success text-text",
  MEETING: "bg-secondary text-text",
  VACATION: "bg-primary/20 text-text",
  OFFLINE: "bg-muted/20 text-text-muted",
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
    <div className="group flex w-full gap-4 px-4 py-2 transition-colors hover:bg-background/40">
      <Avatar className="mt-1 h-10 w-10 shrink-0 rounded-lg shadow-sm">
        <AvatarFallback className="bg-primary/10 text-primary font-headings font-bold">
          {message.authorName.slice(0, 1)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-headings text-[15px] font-bold text-text hover:underline cursor-pointer">
            {message.authorName}
          </span>
          <span className="text-[11px] font-medium text-text-muted">
            {formatTimeLabel(message.createdAt)}
          </span>
        </div>

        <div className="space-y-2">
          {message.content ? (
            <p className="whitespace-pre-wrap text-[15px] leading-6 text-text/90">
              {message.content}
            </p>
          ) : null}

          {message.links.length > 0 ? (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {message.links.map((item) => (
                <LinkCard item={item} key={item.id} />
              ))}
            </div>
          ) : null}

          {/* Dummy visual preview like in the image */}
          {(message.content?.includes("calendar") || message.content?.includes("Q4")) && (
             <div className="mt-3 flex flex-wrap gap-3">
                <div className="relative h-32 w-56 overflow-hidden rounded-xl border border-background/50 group/img">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-3 text-[10px] text-white">
                    <p className="font-bold opacity-70">ASSET PREVIEW</p>
                    <p className="font-headings font-bold uppercase tracking-tight">Main Campaign Visual</p>
                  </div>
                  <div className="h-full w-full bg-primary/20 backdrop-blur-md" />
                </div>
                <div className="relative h-32 w-56 overflow-hidden rounded-xl border border-background/50 group/img">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-3 text-[10px] text-white">
                    <p className="font-bold opacity-70">DATA VISUALIZATION</p>
                    <p className="font-headings font-bold uppercase tracking-tight">Conversion Metrics</p>
                  </div>
                  <div className="h-full w-full bg-secondary/20 backdrop-blur-md" />
                </div>
             </div>
          )}
          
          {message.id === "msg-2" && (
            <div className="mt-2 flex items-center gap-2">
               <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                  <SendHorizontal className="h-3 w-3 -scale-x-100" />
                  <span>답글 3개</span>
                  <div className="ml-1 flex -space-x-2">
                    <div className="h-4 w-4 rounded-full border-2 border-surface bg-secondary" />
                    <div className="h-4 w-4 rounded-full border-2 border-surface bg-primary" />
                  </div>
               </div>
            </div>
          )}
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
        "flex items-center gap-3 rounded-[22px] border px-4 py-3",
        muted
          ? "border-primary-foreground/10 bg-primary-foreground/10"
          : "border-background/80 bg-surface/80 backdrop-blur-sm"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          muted ? "bg-primary-foreground/15" : "bg-primary/10"
        )}
      >
        <Icon className={cn("h-5 w-5", muted ? "text-primary-foreground" : "text-primary")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-headings text-sm font-semibold", muted ? "text-primary-foreground" : "text-text")}>
          {item.label}
        </p>
        <p className={cn("truncate text-xs font-body", muted ? "text-primary-foreground/75" : "text-text-muted")}>
          {item.kind} · {item.meta}
        </p>
      </div>
    </div>
  );
}

function MemberListItem({ member }: { member: ChatterMemberSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-background/80 bg-surface/80 px-3 py-3 shadow-soft">
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
        <p className="truncate text-xs text-text-muted">
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
    <div className={cn("rounded-[24px] border border-transparent px-4 py-3 shadow-soft", tone)}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text/65">
        {label}
      </p>
      <p className="mt-2 text-2xl font-headings font-bold text-text">{value}</p>
    </div>
  );
}

function MessengerSidebarItem({ icon: Icon, label, unread, active = false, onClick }: { icon: LucideIcon; label: string; unread?: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-background/50 hover:text-text"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-text-muted")} />
      <span className="flex-1 text-left">{label}</span>
      {unread ? (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {unread}
        </span>
      ) : null}
    </button>
  );
}

function MessengerNavTab({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
        active ? "text-primary" : "text-text-muted hover:text-text"
      )}
    >
      {label}
      {active && (
        <div className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-primary rounded-t-full" />
      )}
    </button>
  );
}

function SharedAssetItem({ icon: Icon, label, meta, color }: { icon: LucideIcon; label: string; meta: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background/50 cursor-pointer">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-text">{label}</p>
        <p className="truncate text-[11px] font-medium text-text-muted">{meta}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-primary/20 bg-surface/70 px-6 py-10 text-center shadow-soft">
      <p className="font-headings text-lg font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

export function MessengerWorkspace() {
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
  const pins = channelDetail?.pins ?? [];
  const unreadChannelCount = channels.filter((channel) => channel.unreadCount > 0).length;
  const totalUnreadCount = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);
  const activeMembersCount =
    channelDetail?.members.filter((member) => member.status === "ACTIVE").length ?? 0;
  const quickShareCount = shareTargets.documents.length + shareTargets.schedules.length;
  const currentChannelName = channelDetail?.name ?? activeChannelSummary?.name ?? "채널";
  const currentChannelDescription =
    channelDetail?.description ??
    activeChannelSummary?.description ??
    "채널을 선택하면 대화와 맥락 정보를 볼 수 있습니다.";

  return (
    <div className="flex h-full w-full bg-surface/30 overflow-hidden">
      {/* 1. 왼쪽 사이드바 (내부 네비게이션) */}
      <aside className="hidden flex-col border-r border-background/50 bg-surface/50 p-4 md:flex w-[240px]">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-headings font-bold text-text">메신저</h2>
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-text-muted">ENTERPRISE WORKSPACE</p>
          </div>
        </div>

        <Button className="mb-8 w-full justify-start gap-2 rounded-xl py-6 shadow-md hover:scale-[1.02] transition-transform">
          <PlusCircle className="h-5 w-5" />
          <span className="font-bold">새 메시지 작성</span>
        </Button>

        <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-widest text-text-muted/60">MAIN MENU</p>
            <MessengerSidebarItem icon={Home} label="홈" />
            <MessengerSidebarItem icon={MessageSquareText} label="메시지" unread={totalUnreadCount} />
            <MessengerSidebarItem icon={Plus} label="채널" />
            <MessengerSidebarItem icon={Library} label="라이브러리" />
            <MessengerSidebarItem icon={BarChart3} label="분석" />
          </div>

          <div className="space-y-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-text-muted/60">내 채널</p>
              <Plus className="h-4 w-4 text-text-muted cursor-pointer hover:text-primary" />
            </div>
            {filteredChannels.map(channel => (
              <MessengerSidebarItem 
                key={channel.id} 
                icon={channel.type === "DM" ? MessageSquareText : Hash} 
                label={channel.name} 
                active={activeChannelId === channel.id}
                unread={channel.unreadCount}
                onClick={() => setActiveChannelId(channel.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-1 pt-4 border-t border-background/50">
          <MessengerSidebarItem icon={Settings2} label="설정" />
          <MessengerSidebarItem icon={Info} label="지원팀" />
        </div>
      </aside>

      {/* 2. 중앙 메인 업무 공간 */}
      <main className="flex flex-1 flex-col bg-background/20 relative">
        {/* 상단 검색 및 탭 헤더 */}
        <header className="flex h-16 items-center justify-between border-b border-background/50 bg-surface/40 px-6 backdrop-blur-md gap-4">
          <div className="relative w-full max-w-[280px] flex-shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="워크스페이스 검색..." 
              className="h-10 w-full rounded-xl border-transparent bg-background/50 pl-10 focus:bg-background transition-all"
            />
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
             <MessengerNavTab label="🧵 스레드" active />
             <MessengerNavTab label="👥 다이렉트" />
             <MessengerNavTab label="🔔 멘션" />
          </div>

          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-text-muted cursor-pointer hover:text-text" />
            <MoreVertical className="h-5 w-5 text-text-muted cursor-pointer hover:text-text" />
            <Button size="sm" className="rounded-lg px-4 font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">초대하기</Button>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ME</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* 채널 헤더 */}
        <div className="flex items-center justify-between border-b border-background/50 px-8 py-4 bg-surface/20">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-headings font-black text-text flex items-center gap-2">
              <Hash className="h-6 w-6 text-primary" />
              {currentChannelName}
            </h3>
            <p className="text-sm text-text-muted line-clamp-1 max-w-lg">{currentChannelDescription}</p>
          </div>
          <div className="flex items-center gap-[-8px]">
             <div className="flex -space-x-3 mr-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-surface bg-muted shadow-sm" />
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-background text-[10px] font-bold text-text-muted">+18</div>
             </div>
          </div>
        </div>

        {/* 메시지 피드 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-6">
           <div className="flex flex-col gap-2">
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-x-0 h-[1px] bg-background/50" />
                <span className="relative rounded-pill bg-background/80 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-text-muted backdrop-blur-sm border border-background/50">오늘, 3월 31일</span>
              </div>

              {channelQuery.isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              ) : (
                <EmptyState title="메시지가 없습니다" description="팀원들과 대화를 시작해 보세요." />
              )}
           </div>
        </div>

        {/* 입력바 */}
        <div className="p-6 bg-gradient-to-t from-surface/50">
          <div className="relative rounded-2xl border border-background/70 bg-surface/80 p-1 shadow-float focus-within:border-primary/50 transition-all backdrop-blur-xl">
             <textarea 
               value={draft}
               onChange={(e) => setDraft(e.target.value)}
               placeholder={`#${currentChannelName} 채널에 메시지 보내기...`}
               className="min-h-[64px] w-full resize-none border-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted/60 focus:ring-0"
             />
             <div className="flex items-center justify-between px-3 py-2 border-t border-background/50">
                <div className="flex items-center gap-1">
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-text-muted hover:text-primary"><Plus className="h-5 w-5" /></Button>
                   <div className="w-[1px] h-4 bg-background/50 mx-1" />
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-text-muted"><Smile className="h-5 w-5" /></Button>
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-text-muted"><AtSign className="h-5 w-5" /></Button>
                </div>
                <Button 
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMutation.isPending}
                  className="h-10 px-6 rounded-xl font-bold shadow-soft"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                </Button>
             </div>
          </div>
        </div>
      </main>

      {/* 3. 오른쪽 상세 정보 패널 */}
      <aside className="hidden xl:flex flex-col border-l border-background/50 bg-surface/50 w-[280px]">
        <div className="p-6 space-y-8 overflow-y-auto scrollbar-hide">
          {/* 가이드라인 */}
          <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary/5 p-5 shadow-inner">
             <div className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                <h4 className="text-xs font-black uppercase tracking-widest">Channel Guidelines</h4>
             </div>
             <ul className="space-y-3">
                <li className="flex gap-2 text-[13px] leading-relaxed text-text/80">
                   <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                   모든 디자인 리뷰는 해당 채널 PM에게 태그해 주세요.
                </li>
                <li className="flex gap-2 text-[13px] leading-relaxed text-text/80">
                   <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                   스레드 기능을 활용하여 메인 채널의 가독성을 유지해 주세요.
                </li>
             </ul>
          </div>

          {/* 멤버 리스트 */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-muted/70">Members — {channelDetail?.members.length ?? 0}</h4>
                <button className="text-[11px] font-bold text-primary hover:underline">View All</button>
             </div>
             <div className="space-y-1">
                {channelDetail?.members.slice(0, 5).map(member => (
                  <div key={member.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
                    <div className="relative">
                      <Avatar className="h-8 w-8 rounded-lg ring-1 ring-background">
                        <AvatarFallback className="bg-muted text-[10px] font-bold">{member.name.slice(0,1)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface", member.status === "ACTIVE" ? "bg-success" : "bg-muted")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text group-hover:text-primary transition-colors">{member.name}</p>
                      <p className="truncate text-[10px] font-medium text-text-muted">{member.status === "ACTIVE" ? "Active now" : "Away"}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* 공유 자료 모아보기 */}
          <div className="space-y-4">
             <div className="px-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-muted/70">Shared Assets</h4>
             </div>
             <div className="space-y-1">
                <SharedAssetItem icon={FileText} label="branding-guidelines.web" meta="Shared by Sarah • 2일 전" color="bg-orange-500" />
                <SharedAssetItem icon={Library} label="Q4_moodboard_final.png" meta="Shared by Marcus • 3일 전" color="bg-blue-500" />
                <SharedAssetItem icon={BarChart3} label="ad_spend_budget.xlsx" meta="Shared by David • 4일 전" color="bg-emerald-500" />
             </div>
             <Button variant="ghost" className="w-full text-[11px] font-bold text-text-muted bg-background/30 rounded-xl hover:bg-background/50">Show All Media</Button>
          </div>
        </div>

        {/* 워크스페이스 헬스 (하단 고정) */}
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-surface-dark p-5 shadow-2xl space-y-4 border border-white/5">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Productivity</p>
             <h5 className="text-sm font-black text-white">Workspace Health</h5>
             <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full w-[85%] bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/40">
                   <p>85% team engagement in the last 7 days.</p>
                </div>
             </div>
             <p className="text-[10px] italic text-primary/80">Excellent work!</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
