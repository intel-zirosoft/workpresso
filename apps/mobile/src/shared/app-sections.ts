export type MobileAppSection = {
  description: string;
  href: string;
  path: string;
  title: string;
};

export const MOBILE_APP_SECTIONS = {
  chat: {
    description: '업무 질문과 빠른 답변',
    href: '/(tabs)/chat',
    path: '/chat?mobile=1&context=work',
    title: '업무 도우미',
  },
  chatter: {
    description: '읽지 않은 채널과 브리핑 확인',
    href: '/(tabs)/chatter',
    path: '/chatter?mobile=1&view=inbox',
    title: '채터',
  },
  documents: {
    description: '승인 대기 문서와 결재 처리',
    href: '/(tabs)/documents',
    path: '/documents?mobile=1&scope=approvals&status=PENDING',
    title: '문서',
  },
  schedules: {
    description: '오늘 일정과 회의 확인',
    href: '/(tabs)/schedules',
    path: '/schedules?mobile=1&focus=today',
    title: '일정',
  },
  voice: {
    description: '회의 기록과 음성 메모 진입',
    href: '/(tabs)/voice',
    path: '/voice?mobile=1&entry=quick-record',
    title: '음성',
  },
} as const satisfies Record<string, MobileAppSection>;
