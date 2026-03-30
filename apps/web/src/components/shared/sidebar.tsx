"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MessageSquare, Users, Layout, Bot, LogOut, Calendar, FileText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [

  { name: "홈", href: "/", icon: Home },
  { name: "문서", href: "/documents", icon: FileText },
  { name: "업무 도우미", href: "/chat", icon: Bot }, // Pod C: AI Agent
  { name: "채터", href: "/chatter", icon: MessageSquare },
  { name: "팀원", href: "/teammates", icon: Users },
  // { name: "캔버스", href: "/canvas", icon: Layout },
  { name: "일정", href: "/schedules", icon: Calendar },
  { name: "음성", href: "/voice", icon: Mic }, // Pod D: Meeting Logs
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <aside className="w-[260px] h-screen sticky top-0 bg-surface border-r border-transparent shadow-soft flex flex-col z-40">
      {/* Logo / Wordmark */}
      <div className="p-8">
        <Link href="/" className="text-2xl font-headings font-bold text-primary tracking-tight">
          WorkPresso
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-pill transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-soft" 
                  : "text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-muted group-hover:text-text")} />
              <span className="font-headings font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile / Bottom Menu - Removed as it moved to Header */}
      <div className="p-6 mt-auto border-t border-background/50">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-muted hover:bg-destructive/10 hover:text-destructive rounded-pill transition-all duration-200 group"
        >
          <LogOut size={20} />
          <span className="font-headings font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
