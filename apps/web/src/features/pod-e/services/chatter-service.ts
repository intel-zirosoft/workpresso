import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ChatterChannelDetail,
  ChatterChannelSummary,
  ChatterLinkCard,
  ChatterMemberSummary,
  ChatterMessageSummary,
} from "@/features/pod-e/services/chatter-types";

const createChatterMessageSchema = z
  .object({
    content: z.string().trim().max(2000, "메시지는 2000자를 넘길 수 없습니다.").optional().default(""),
    linkedObject: z
      .object({
        type: z.enum(["DOCUMENT", "SCHEDULE"]),
        id: z.string().uuid(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.content.trim() && !value.linkedObject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "메시지 내용이나 링크 객체 중 하나는 필요합니다.",
        path: ["content"],
      });
    }
  });

type CreateChatterMessageInput = z.infer<typeof createChatterMessageSchema>;

type ChannelRow = {
  id: string;
  name: string;
  description: string | null;
  type: "ANNOUNCEMENT" | "DEPARTMENT" | "PROJECT" | "DM";
  owner_id: string | null;
  last_message_at: string | null;
  is_archived: boolean | null;
};

type ChannelMemberRow = {
  channel_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type UserRow = {
  id: string;
  name: string;
  department: string | null;
  status: "ACTIVE" | "MEETING" | "VACATION" | "OFFLINE" | null;
};

type MessageRow = {
  id: string;
  channel_id: string;
  author_id: string;
  content: string | null;
  message_type: "TEXT" | "SYSTEM" | "FILE" | "LINKED_OBJECT";
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

type ScheduleRow = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
};

type LinkedObjectMeta = {
  type: "DOCUMENT" | "SCHEDULE";
  id: string;
  label: string;
  kind: "문서" | "일정";
  meta: string;
};

export type ChatterShareTarget = {
  id: string;
  label: string;
  type: "DOCUMENT" | "SCHEDULE";
  meta: string;
};

export function parseCreateChatterMessageInput(payload: unknown) {
  return createChatterMessageSchema.safeParse(payload);
}

function getAdminSupabase() {
  return createAdminClient();
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((value): value is string => Boolean(value))));
}

function normalizeLinkedObject(metadata: Record<string, unknown> | null): LinkedObjectMeta | null {
  const linkedObject = metadata?.linkedObject;

  if (!linkedObject || typeof linkedObject !== "object") {
    return null;
  }

  const candidate = linkedObject as Record<string, unknown>;
  const type = candidate.type;
  const id = candidate.id;
  const label = candidate.label;
  const kind = candidate.kind;
  const meta = candidate.meta;

  if (
    (type !== "DOCUMENT" && type !== "SCHEDULE") ||
    typeof id !== "string" ||
    typeof label !== "string" ||
    (kind !== "문서" && kind !== "일정") ||
    typeof meta !== "string"
  ) {
    return null;
  }

  return { type, id, label, kind, meta };
}

function buildPreview(message: MessageRow | undefined) {
  if (!message) {
    return "아직 메시지가 없습니다.";
  }

  const content = message.content?.trim();
  if (content) {
    return content;
  }

  const linkedObject = normalizeLinkedObject(message.metadata);
  if (linkedObject) {
    return `${linkedObject.kind} 공유: ${linkedObject.label}`;
  }

  return "새 메시지";
}

function buildLinkCards(message: MessageRow): ChatterLinkCard[] {
  const linkedObject = normalizeLinkedObject(message.metadata);

  if (!linkedObject) {
    return [];
  }

  return [
    {
      id: linkedObject.id,
      label: linkedObject.label,
      kind: linkedObject.kind,
      meta: linkedObject.meta,
    },
  ];
}

function buildMessageSummary(message: MessageRow, usersById: Map<string, UserRow>, currentUserId: string) {
  const author = usersById.get(message.author_id);

  return {
    id: message.id,
    authorId: message.author_id,
    authorName: author?.name ?? "알 수 없는 사용자",
    authorRole: author?.department ?? "구성원",
    content: message.content?.trim() ?? "",
    messageType: message.message_type,
    createdAt: message.created_at,
    isMine: message.author_id === currentUserId,
    links: buildLinkCards(message),
  } satisfies ChatterMessageSummary;
}

function mapMemberRole(role: ChannelMemberRow["role"]) {
  if (role === "OWNER") return "채널 소유자";
  if (role === "ADMIN") return "채널 관리자";
  return "채널 멤버";
}

function formatAbsoluteDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDocumentStatus(status: string) {
  if (status === "APPROVED") return "승인됨";
  if (status === "PENDING") return "승인 대기";
  if (status === "REJECTED") return "반려";
  return "임시 저장";
}

function formatScheduleWindow(schedule: ScheduleRow) {
  const start = new Date(schedule.start_time);
  const end = new Date(schedule.end_time);

  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(start);

  const timeLabel = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);

  const endTimeLabel = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(end);

  return `${dateLabel} · ${timeLabel} - ${endTimeLabel}`;
}

async function getAccessibleChannel(userId: string, channelId: string) {
  const adminSupabase = getAdminSupabase();
  const { data: channel, error: channelError } = await adminSupabase
    .from("chat_channels")
    .select("id, name, description, type, owner_id, last_message_at, is_archived")
    .eq("id", channelId)
    .is("deleted_at", null)
    .returns<ChannelRow[]>()
    .maybeSingle();

  if (channelError) {
    throw channelError;
  }

  if (!channel) {
    return null;
  }

  if (channel.owner_id === userId) {
    return channel;
  }

  const { data: membership, error: membershipError } = await adminSupabase
    .from("chat_channel_members")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  return membership ? channel : null;
}

export async function listUserChannels(userId: string) {
  const adminSupabase = getAdminSupabase();

  const [{ data: memberships, error: membershipError }, { data: ownedChannels, error: ownedError }] =
    await Promise.all([
      adminSupabase
        .from("chat_channel_members")
        .select("channel_id, user_id, role")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .returns<ChannelMemberRow[]>(),
      adminSupabase
        .from("chat_channels")
        .select("id")
        .eq("owner_id", userId)
        .is("deleted_at", null),
    ]);

  if (membershipError) {
    throw membershipError;
  }

  if (ownedError) {
    throw ownedError;
  }

  const channelIds = uniqueIds([
    ...(memberships ?? []).map((membership) => membership.channel_id),
    ...(ownedChannels ?? []).map((channel) => channel.id),
  ]);

  if (channelIds.length === 0) {
    return [];
  }

  const [{ data: channels, error: channelsError }, { data: members, error: membersError }, { data: messages, error: messagesError }] =
    await Promise.all([
      adminSupabase
        .from("chat_channels")
        .select("id, name, description, type, owner_id, last_message_at, is_archived")
        .in("id", channelIds)
        .is("deleted_at", null)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .returns<ChannelRow[]>(),
      adminSupabase
        .from("chat_channel_members")
        .select("channel_id")
        .in("channel_id", channelIds)
        .is("deleted_at", null),
      adminSupabase
        .from("chat_messages")
        .select("id, channel_id, author_id, content, message_type, metadata, created_at")
        .in("channel_id", channelIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .returns<MessageRow[]>(),
    ]);

  if (channelsError) {
    throw channelsError;
  }

  if (membersError) {
    throw membersError;
  }

  if (messagesError) {
    throw messagesError;
  }

  const firstMessageByChannel = new Map<string, MessageRow>();
  for (const message of messages ?? []) {
    if (!firstMessageByChannel.has(message.channel_id)) {
      firstMessageByChannel.set(message.channel_id, message);
    }
  }

  const memberCountByChannel = new Map<string, number>();
  for (const member of members ?? []) {
    memberCountByChannel.set(member.channel_id, (memberCountByChannel.get(member.channel_id) ?? 0) + 1);
  }

  return (channels ?? []).map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description ?? "",
    type: channel.type,
    unreadCount: 0,
    memberCount: memberCountByChannel.get(channel.id) ?? 0,
    lastMessagePreview: buildPreview(firstMessageByChannel.get(channel.id)),
    lastActivityAt: channel.last_message_at ?? firstMessageByChannel.get(channel.id)?.created_at ?? null,
  })) satisfies ChatterChannelSummary[];
}

export async function getChannelMessages(userId: string, channelId: string) {
  const adminSupabase = getAdminSupabase();
  const channel = await getAccessibleChannel(userId, channelId);

  if (!channel) {
    return null;
  }

  const [{ data: memberRows, error: membersError }, { data: messageRows, error: messagesError }, { data: documents, error: documentsError }, { data: schedules, error: schedulesError }] =
    await Promise.all([
      adminSupabase
        .from("chat_channel_members")
        .select("channel_id, user_id, role")
        .eq("channel_id", channelId)
        .is("deleted_at", null)
        .returns<ChannelMemberRow[]>(),
      adminSupabase
        .from("chat_messages")
        .select("id, channel_id, author_id, content, message_type, metadata, created_at")
        .eq("channel_id", channelId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .returns<MessageRow[]>(),
      adminSupabase
        .from("documents")
        .select("id, title, status, updated_at")
        .eq("author_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(3)
        .returns<DocumentRow[]>(),
      adminSupabase
        .from("schedules")
        .select("id, title, start_time, end_time")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("start_time", { ascending: true })
        .limit(3)
        .returns<ScheduleRow[]>(),
    ]);

  if (membersError) {
    throw membersError;
  }

  if (messagesError) {
    throw messagesError;
  }

  if (documentsError) {
    throw documentsError;
  }

  if (schedulesError) {
    throw schedulesError;
  }

  const memberUserIds = uniqueIds([
    ...(memberRows ?? []).map((member) => member.user_id),
    channel.owner_id,
    ...(messageRows ?? []).map((message) => message.author_id),
  ]);

  const { data: users, error: usersError } = await adminSupabase
    .from("users")
    .select("id, name, department, status")
    .in("id", memberUserIds)
    .returns<UserRow[]>();

  if (usersError) {
    throw usersError;
  }

  const usersById = new Map((users ?? []).map((user) => [user.id, user]));
  const memberRowsByUserId = new Map((memberRows ?? []).map((member) => [member.user_id, member]));

  const members = memberUserIds.map((memberId) => {
    const user = usersById.get(memberId);
    const membership = memberRowsByUserId.get(memberId);
    const role = membership?.role ?? (memberId === channel.owner_id ? "OWNER" : "MEMBER");

    return {
      id: memberId,
      name: user?.name ?? "알 수 없는 사용자",
      role: mapMemberRole(role),
      department: user?.department ?? "미지정",
      status: user?.status ?? "OFFLINE",
    } satisfies ChatterMemberSummary;
  });

  const messages = (messageRows ?? []).map((message) => buildMessageSummary(message, usersById, userId));
  const sharedItems = messages.flatMap((message) => message.links).slice(-4).reverse();

  return {
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description ?? "",
      type: channel.type,
      members,
      pins: [],
      sharedItems,
    } satisfies ChatterChannelDetail,
    messages,
    shareTargets: {
      documents: (documents ?? []).map((document) => ({
        id: document.id,
        label: document.title,
        type: "DOCUMENT" as const,
        meta: `${formatDocumentStatus(document.status)} · ${formatAbsoluteDate(document.updated_at)}`,
      })),
      schedules: (schedules ?? []).map((schedule) => ({
        id: schedule.id,
        label: schedule.title,
        type: "SCHEDULE" as const,
        meta: formatScheduleWindow(schedule),
      })),
    },
  };
}

export async function createChannelMessage(userId: string, channelId: string, input: CreateChatterMessageInput) {
  const adminSupabase = getAdminSupabase();
  const channel = await getAccessibleChannel(userId, channelId);

  if (!channel) {
    return null;
  }

  const trimmedContent = input.content.trim();
  let messageType: MessageRow["message_type"] = "TEXT";
  let metadata: Record<string, unknown> = {};

  if (input.linkedObject) {
    if (input.linkedObject.type === "DOCUMENT") {
      const { data: document, error } = await adminSupabase
        .from("documents")
        .select("id, title, status, updated_at")
        .eq("id", input.linkedObject.id)
        .eq("author_id", userId)
        .is("deleted_at", null)
        .returns<DocumentRow[]>()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!document) {
        throw new Error("공유할 문서를 찾을 수 없습니다.");
      }

      metadata = {
        linkedObject: {
          type: "DOCUMENT",
          id: document.id,
          label: document.title,
          kind: "문서",
          meta: `${formatDocumentStatus(document.status)} · ${formatAbsoluteDate(document.updated_at)}`,
        },
      };
      messageType = "LINKED_OBJECT";
    }

    if (input.linkedObject.type === "SCHEDULE") {
      const { data: schedule, error } = await adminSupabase
        .from("schedules")
        .select("id, title, start_time, end_time")
        .eq("id", input.linkedObject.id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .returns<ScheduleRow[]>()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!schedule) {
        throw new Error("공유할 일정을 찾을 수 없습니다.");
      }

      metadata = {
        linkedObject: {
          type: "SCHEDULE",
          id: schedule.id,
          label: schedule.title,
          kind: "일정",
          meta: formatScheduleWindow(schedule),
        },
      };
      messageType = "LINKED_OBJECT";
    }
  }

  const { data: message, error: insertError } = await adminSupabase
    .from("chat_messages")
    .insert({
      channel_id: channelId,
      author_id: userId,
      content: trimmedContent,
      message_type: messageType,
      metadata,
    })
    .select("id, channel_id, author_id, content, message_type, metadata, created_at")
    .returns<MessageRow[]>()
    .single();

  if (insertError) {
    throw insertError;
  }

  const { error: updateChannelError } = await adminSupabase
    .from("chat_channels")
    .update({ last_message_at: message.created_at })
    .eq("id", channelId);

  if (updateChannelError) {
    throw updateChannelError;
  }

  const { data: author, error: authorError } = await adminSupabase
    .from("users")
    .select("id, name, department, status")
    .eq("id", userId)
    .returns<UserRow[]>()
    .maybeSingle();

  if (authorError) {
    throw authorError;
  }

  const usersById = new Map<string, UserRow>();
  if (author) {
    usersById.set(author.id, author);
  }

  return buildMessageSummary(message, usersById, userId);
}
