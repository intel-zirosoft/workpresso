"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Users, Layout, FileText, Mic, Bot, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/settings/services/userAction";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Work Assistant", href: "/chat", icon: Bot }, // Pod C: AI Agent
  { name: "Chatter", href: "/chatter", icon: MessageSquare },
  { name: "Teammates", href: "/teammates", icon: Users },
  { name: "Canvas", href: "/canvas", icon: Layout },
  { name: "Voice", href: "/voice", icon: Mic }, // Pod D: Meeting Logs
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(),
    retry: 1,
  });

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
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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

      {/* Profile / Bottom Menu */}
      <div className="p-6 mt-auto border-t border-background/50">
        <div className="flex items-center gap-3 p-2 rounded-md">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shadow-sm">
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'Felix'}`} 
              alt="User" 
            />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted/20 animate-pulse rounded" />
                <div className="h-2 w-16 bg-muted/10 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-text truncate">
                  {profile?.name || 'New User'}
                </p>
                <p className="text-[11px] font-medium text-muted truncate">
                  {profile?.role === 'SUPER_ADMIN' ? '최고 관리자' : 
                   profile?.role === 'ORG_ADMIN' ? '조직 관리자' :
                   profile?.role === 'TEAM_ADMIN' ? '팀 관리자' : '일반 사용자'}
                </p>
              </>
            )}
          </div>
          <button className="text-muted hover:text-destructive transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
