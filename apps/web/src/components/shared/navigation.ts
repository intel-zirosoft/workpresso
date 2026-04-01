import {
  Bot,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Mic,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AppNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { name: "홈", href: "/", icon: Home },
  { name: "문서", href: "/documents", icon: FileText },
  { name: "업무 도우미", href: "/chat", icon: Bot },
  { name: "메신저", href: "/messenger", icon: MessageSquare },
  { name: "팀원", href: "/teammates", icon: Users },
  { name: "일정", href: "/schedules", icon: Calendar },
  { name: "음성", href: "/voice", icon: Mic },
];

export const ADMIN_NAV_ITEMS: AppNavItem[] = [
  {
    name: "설정",
    href: "/settings/integrations",
    icon: Settings2,
    adminOnly: true,
  },
];

export const CHROMELESS_PATH_PREFIXES = ["/login", "/signup"];

export const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const isChromelessPath = (pathname: string | null) =>
  pathname
    ? CHROMELESS_PATH_PREFIXES.some((path) => pathname.startsWith(path))
    : false;

export const getCurrentSectionTitle = (pathname: string | null) => {
  if (!pathname) return "WorkPresso";
  if (pathname.startsWith("/settings")) return "설정";
  const allItems = [...APP_NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  return (
    allItems.find((item) => isActivePath(pathname, item.href))?.name ??
    "WorkPresso"
  );
};
