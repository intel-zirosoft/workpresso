export type ChatterChannelType = "ANNOUNCEMENT" | "DEPARTMENT" | "PROJECT" | "DM";
export type ChatterMemberStatus =
  | "ACTIVE"
  | "MEETING"
  | "VACATION"
  | "OFFLINE";

export type ChatterLinkItem = {
  id: string;
  label: string;
  kind: "문서" | "일정" | "회의록";
  meta: string;
};

export type ChatterMessage = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  sentAt: string;
  body: string;
  isMine?: boolean;
  highlight?: string;
  links?: ChatterLinkItem[];
};

export type ChatterMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: ChatterMemberStatus;
  avatarTone: string;
};

export type ChatterChannel = {
  id: string;
  name: string;
  type: ChatterChannelType;
  description: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastActivityLabel: string;
  emphasis?: "notice" | "priority";
  members: ChatterMember[];
  pins: string[];
  sharedItems: ChatterLinkItem[];
  messages: ChatterMessage[];
};

export const chatterChannels: ChatterChannel[] = [
  {
    id: "dept-frontend",
    name: "프론트엔드 챕터",
    type: "DEPARTMENT",
    description:
      "웹 클라이언트 품질, 배포 일정, 디자인 시스템 논의를 정리하는 부서 채널입니다.",
    unreadCount: 3,
    lastMessagePreview: "오늘 QA 반영 건은 오후 4시 이전으로 마감할게요.",
    lastActivityLabel: "방금 전",
    emphasis: "priority",
    members: [
      {
        id: "m-1",
        name: "서하윤",
        role: "Frontend Lead",
        department: "Frontend",
        status: "ACTIVE",
        avatarTone: "bg-primary/20",
      },
      {
        id: "m-2",
        name: "민도현",
        role: "Product Designer",
        department: "Design",
        status: "MEETING",
        avatarTone: "bg-secondary/35",
      },
      {
        id: "m-3",
        name: "박지후",
        role: "QA Engineer",
        department: "QA",
        status: "ACTIVE",
        avatarTone: "bg-success/30",
      },
      {
        id: "me",
        name: "나",
        role: "Frontend Engineer",
        department: "Frontend",
        status: "ACTIVE",
        avatarTone: "bg-primary/35",
      },
    ],
    pins: [
      "이번 주 배포 창구는 금요일 17:00까지입니다.",
      "모든 화면 변경은 QA 체크리스트 링크와 함께 공유해 주세요.",
    ],
    sharedItems: [
      {
        id: "doc-1",
        label: "웹 QA 체크리스트 v3",
        kind: "문서",
        meta: "승인 대기 · 오늘 15:00 마감",
      },
      {
        id: "sch-1",
        label: "배포 리허설",
        kind: "일정",
        meta: "오늘 16:30 - 17:00",
      },
      {
        id: "log-1",
        label: "디자인 시스템 주간 회의",
        kind: "회의록",
        meta: "어제 생성 · 액션 4건",
      },
    ],
    messages: [
      {
        id: "msg-1",
        authorId: "m-1",
        authorName: "서하윤",
        authorRole: "Frontend Lead",
        sentAt: "09:12",
        body:
          "오늘 배포분은 접근성 수정과 캘린더 폴리시 반영이 핵심입니다. QA 끝난 화면부터 링크 남겨 주세요.",
        highlight: "중요",
      },
      {
        id: "msg-2",
        authorId: "m-2",
        authorName: "민도현",
        authorRole: "Product Designer",
        sentAt: "09:18",
        body:
          "문서 카드 hover 상태만 마지막 확인 부탁드려요. 시안은 아래 문서에 정리했습니다.",
        links: [
          {
            id: "doc-1",
            label: "웹 QA 체크리스트 v3",
            kind: "문서",
            meta: "승인 대기 · Figma 링크 포함",
          },
        ],
      },
      {
        id: "msg-3",
        authorId: "me",
        authorName: "나",
        authorRole: "Frontend Engineer",
        sentAt: "09:24",
        body:
          "@박지후 캘린더 수정본 배포 전 빌드까지 확인 부탁드립니다. 리허설 일정도 여기 공유해둘게요.",
        isMine: true,
        links: [
          {
            id: "sch-1",
            label: "배포 리허설",
            kind: "일정",
            meta: "오늘 16:30 - 17:00",
          },
        ],
      },
      {
        id: "msg-4",
        authorId: "m-3",
        authorName: "박지후",
        authorRole: "QA Engineer",
        sentAt: "09:28",
        body:
          "확인 중입니다. 회귀 테스트 이슈는 없고, 문서 목록 필터만 한 번 더 볼게요.",
      },
    ],
  },
  {
    id: "announce-all",
    name: "전사 공지",
    type: "ANNOUNCEMENT",
    description:
      "필수 공지와 운영 정책이 공유되는 채널입니다. 일반 구성원은 읽기 중심으로 사용합니다.",
    unreadCount: 1,
    lastMessagePreview: "보안 점검으로 인해 오늘 19:00 이후 VPN 재로그인이 필요합니다.",
    lastActivityLabel: "10분 전",
    emphasis: "notice",
    members: [
      {
        id: "m-4",
        name: "운영팀",
        role: "Admin",
        department: "Operations",
        status: "ACTIVE",
        avatarTone: "bg-primary/15",
      },
      {
        id: "me",
        name: "나",
        role: "Frontend Engineer",
        department: "Frontend",
        status: "ACTIVE",
        avatarTone: "bg-primary/35",
      },
    ],
    pins: ["보안 점검 공지는 반드시 확인 버튼을 눌러 주세요."],
    sharedItems: [
      {
        id: "doc-2",
        label: "원격 근무 보안 수칙",
        kind: "문서",
        meta: "최종본 · 운영팀 게시",
      },
    ],
    messages: [
      {
        id: "msg-5",
        authorId: "m-4",
        authorName: "운영팀",
        authorRole: "Admin",
        sentAt: "08:40",
        body:
          "보안 점검으로 인해 오늘 19:00 이후 VPN 재로그인이 필요합니다. 외부망 작업 중인 분들은 저장 후 재접속해 주세요.",
        highlight: "필독",
        links: [
          {
            id: "doc-2",
            label: "원격 근무 보안 수칙",
            kind: "문서",
            meta: "최종본 · 운영팀 게시",
          },
        ],
      },
    ],
  },
  {
    id: "dm-jiwon",
    name: "김지원",
    type: "DM",
    description: "1:1 업무 대화방입니다. 민감한 내용은 필요한 인원에게만 공유합니다.",
    unreadCount: 0,
    lastMessagePreview: "회의록 자동 공유 흐름, 내일 같이 보죠.",
    lastActivityLabel: "어제",
    members: [
      {
        id: "m-5",
        name: "김지원",
        role: "Backend Engineer",
        department: "Platform",
        status: "OFFLINE",
        avatarTone: "bg-secondary/40",
      },
      {
        id: "me",
        name: "나",
        role: "Frontend Engineer",
        department: "Frontend",
        status: "ACTIVE",
        avatarTone: "bg-primary/35",
      },
    ],
    pins: [],
    sharedItems: [
      {
        id: "log-3",
        label: "회의록 자동 공유 흐름",
        kind: "회의록",
        meta: "초안 · 내일 리뷰",
      },
    ],
    messages: [
      {
        id: "msg-6",
        authorId: "m-5",
        authorName: "김지원",
        authorRole: "Backend Engineer",
        sentAt: "어제 17:18",
        body:
          "채터에서 회의록 카드 눌렀을 때 권한 체크 먼저 걸어둘게요. 프론트는 메타 카드만 보여줘도 충분할 것 같아요.",
      },
      {
        id: "msg-7",
        authorId: "me",
        authorName: "나",
        authorRole: "Frontend Engineer",
        sentAt: "어제 17:20",
        body: "좋아요. 회의록 자동 공유 흐름은 내일 같이 보고 확정하죠.",
        isMine: true,
      },
    ],
  },
];
