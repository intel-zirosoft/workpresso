import {
  Bot,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Mic,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AppNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { name: "홈", href: "/", icon: Home },
  { name: "문서", href: "/documents", icon: FileText },
  { name: "업무 도우미", href: "/chat", icon: Bot },
  { name: "채터", href: "/chatter", icon: MessageSquare },
  { name: "팀원", href: "/teammates", icon: Users },
  { name: "일정", href: "/schedules", icon: Calendar },
  { name: "음성", href: "/voice", icon: Mic },
];

export const CHROMELESS_PATH_PREFIXES = ["/login", "/signup"];

export const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const isChromelessPath = (pathname: string) =>
  CHROMELESS_PATH_PREFIXES.some((path) => pathname.startsWith(path));

export const getCurrentSectionTitle = (pathname: string) => {
  if (pathname.startsWith("/settings")) return "설정";
  return APP_NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.name ?? "WorkPresso";
};
