"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { APP_NAV_ITEMS, ADMIN_NAV_ITEMS, isActivePath, type AppNavItem } from "@/components/shared/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/features/settings/services/userAction";

interface SidebarContentProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

export function SidebarContent({ onNavigate, mobile = false }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const profile = await getUserProfile();
        setIsAdmin(profile.role === 'SUPER_ADMIN' || profile.role === 'ORG_ADMIN');
      } catch (e) {
        setIsAdmin(false);
      }
    }
    checkRole();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate?.();
    router.refresh();
    router.push("/login");
  };

  return (
    <>
      <div className={cn("border-background/50", mobile ? "border-b px-5 py-5" : "p-8")}>
        <Link
          href="/"
          onClick={onNavigate}
          className="text-2xl font-headings font-bold tracking-tight text-primary"
        >
          WorkPresso
        </Link>
      </div>

      <nav className={cn("flex-1", mobile ? "space-y-1 px-3 py-4" : "space-y-2 px-4")}>
        {APP_NAV_ITEMS.map((item: AppNavItem) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 transition-all duration-200",
                mobile ? "rounded-2xl px-4 py-3.5" : "rounded-pill px-4 py-3",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon
                size={20}
                className={cn(isActive ? "text-white" : "text-text-muted group-hover:text-text")}
              />
              <span className="font-headings font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto border-t border-background/50 space-y-2", mobile ? "p-3" : "p-6")}>
        {isAdmin && ADMIN_NAV_ITEMS.map((item: AppNavItem) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 transition-all duration-200",
                mobile ? "rounded-2xl px-4 py-3.5" : "rounded-pill px-4 py-3",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon
                size={20}
                className={cn(isActive ? "text-primary" : "text-text-muted group-hover:text-text")}
              />
              <span className="font-headings font-medium">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-pill px-4 py-3 text-text-muted transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group"
        >
          <LogOut size={20} />
          <span className="font-headings font-medium">로그아웃</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[260px] h-screen sticky top-0 bg-surface border-r border-transparent shadow-soft flex flex-col z-40">
      <SidebarContent />
    </aside>
  );
}
