export type ChatterChannelType = "ANNOUNCEMENT" | "DEPARTMENT" | "PROJECT" | "DM";

export type ChatterMemberStatus = "ACTIVE" | "MEETING" | "VACATION" | "OFFLINE";

export type ChatterLinkCard = {
  id: string;
  label: string;
  kind: "문서" | "일정";
  meta: string;
};

export type ChatterChannelSummary = {
  id: string;
  name: string;
  description: string;
  type: ChatterChannelType;
  unreadCount: number;
  memberCount: number;
  lastMessagePreview: string;
  lastActivityAt: string | null;
};

export type ChatterMemberSummary = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: ChatterMemberStatus;
};

export type ChatterMessageSummary = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  messageType: "TEXT" | "SYSTEM" | "FILE" | "LINKED_OBJECT";
  createdAt: string;
  isMine: boolean;
  links: ChatterLinkCard[];
};

export type ChatterShareTarget = {
  id: string;
  label: string;
  type: "DOCUMENT" | "SCHEDULE";
  meta: string;
};

export type ChatterChannelDetail = {
  id: string;
  name: string;
  description: string;
  type: ChatterChannelType;
  members: ChatterMemberSummary[];
  pins: string[];
  sharedItems: ChatterLinkCard[];
};
