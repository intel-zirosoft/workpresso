"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
=======
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
>>>>>>> develop
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/settings/services/userAction";
import { UserRoleBadge } from "@/features/settings/components/UserRoleBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarContent } from "@/components/shared/sidebar";
import { getCurrentSectionTitle } from "@/components/shared/navigation";
import { isEmbeddedMobileApp } from "@/lib/mobile-app";
import { useTheme } from "@/providers/theme-provider";
<<<<<<< HEAD
import { cn } from "@/lib/utils";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
=======
import { getCurrentSectionTitle } from "@/components/shared/navigation";

export function Header() {
  const pathname = usePathname();
>>>>>>> develop
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileAppShell, setIsMobileAppShell] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const pathname = usePathname();
  const currentSectionTitle = getCurrentSectionTitle(pathname);
  const { resolvedTheme, setThemePreference } = useTheme();


  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(),
    retry: 1,
    enabled: !!user,
  });

  useEffect(() => {
    setIsMobileAppShell(isEmbeddedMobileApp());
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      if (initialUser) {
        setUser(initialUser);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isDarkMode = resolvedTheme === "dark";

  const handleThemeToggle = () => {
    setThemePreference(isDarkMode ? "light" : "dark");
  };

  const currentSectionTitle = getCurrentSectionTitle(pathname);

  return (
    <header className="sticky top-3 z-30 flex h-[72px] items-center justify-between bg-background/80 px-4 backdrop-blur-md md:h-[65px] md:px-10">
      <div className="flex min-w-0 items-center gap-3 md:flex-1">
        <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden",
                isMobileAppShell
                  ? "h-11 w-11 rounded-2xl border border-background/70 bg-surface text-text shadow-soft hover:bg-surface"
                  : "text-primary",
              )}
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent
            className={cn(
              "left-0 top-0 max-w-none translate-x-0 translate-y-0 gap-0 p-0 shadow-2xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
              isMobileAppShell
                ? "h-[calc(100vh-1rem)] w-[min(84vw,340px)] rounded-[28px] border-none bg-background/95"
                : "h-full w-[min(88vw,320px)] rounded-none border-none bg-surface",
            )}
          >
            <div className="sr-only">
              <DialogTitle>주 메뉴</DialogTitle>
              <DialogDescription>서비스의 주요 화면으로 이동합니다.</DialogDescription>
            </div>
            <div className="flex h-full flex-col">
              <SidebarContent
                mobile
                appShell={isMobileAppShell}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            Workspace
          </p>
          {pathname === "/schedules" ? (
            <div className="flex flex-col">
              <h1 className="font-headings text-lg font-bold text-text md:text-2xl leading-tight">
                업무 일정 관리
              </h1>
              <p className="text-text-muted text-[10px] md:text-xs font-medium mt-0.5">
                나의 스케줄을 확인하고 관리하세요.
              </p>
            </div>
          ) : (
            <h1 className="truncate font-headings text-lg font-bold text-text md:text-2xl leading-tight">
              {currentSectionTitle}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label={isDarkMode ? "라이트 테마로 변경" : "다크 테마로 변경"}
          onClick={handleThemeToggle}
          className="hidden items-center gap-2.5 rounded-pill border border-background/60 bg-surface/80 px-2.5 py-2 shadow-soft transition-colors hover:bg-surface sm:flex"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <Sun
              className={cn(
                "h-4 w-4 transition-colors",
                isDarkMode ? "text-text-muted" : "text-primary"
              )}
            />
          </span>
          <span
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              isDarkMode ? "bg-primary/20" : "bg-secondary/80"
            )}
          >
            <span
              className={cn(
                "absolute left-1 top-1 h-5 w-5 rounded-full bg-primary shadow-sm transition-transform",
                isDarkMode ? "translate-x-6" : "translate-x-0"
              )}
            />
          </span>
          <span className="flex h-5 w-5 items-center justify-center">
            <Moon
              className={cn(
                "h-4 w-4 transition-colors",
                isDarkMode ? "text-primary" : "text-text-muted"
              )}
            />
          </span>
          <span className="hidden w-10 shrink-0 text-center text-xs font-semibold text-text-muted lg:inline-block">
            {isDarkMode ? "다크" : "라이트"}
          </span>
        </button>

        {loading || (user && isProfileLoading) ? (
          <div className="flex items-center gap-3 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-2 w-12 bg-muted/50 animate-pulse rounded" />
            </div>
          </div>
        ) : user ? (
          /* 로그인 성공 UI */
          <div className="flex items-center gap-2 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft backdrop-blur-sm transition-all hover:bg-surface md:gap-3 md:pr-4">
            <Avatar className="h-9 w-9 shadow-sm border border-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || user.email}`} />
              <AvatarFallback className="bg-secondary/30 text-primary font-bold text-xs">
                {(profile?.name || user.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-[120px] flex-col md:flex">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text leading-tight truncate max-w-[100px]">
                  {profile?.name || user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                {profile?.role && (
                  <UserRoleBadge role={profile.role} className="scale-75 origin-left" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] font-medium text-text-muted leading-tight">
                  {profile?.department || "구성원"}
                </p>
                <span className="w-1 h-1 rounded-full bg-muted/30" />
                <p className="text-[10px] font-medium text-primary/60 leading-tight">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mx-1 hidden h-8 w-[1px] bg-background/50 md:block" />
            <div className="flex items-center gap-1">
              <button 
                onClick={() =>
                  router.push(
                    isMobileAppShell ? "/mobile-settings" : "/settings/integrations",
                  )
                }
                className="text-text-muted hover:text-primary transition-all p-1.5 hover:bg-primary/10 rounded-full"
                title="설정"
                aria-label="설정으로 이동"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSignOut}
                className="text-text-muted hover:text-destructive transition-all p-1.5 hover:bg-destructive/10 rounded-full"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* 로그인 필요 UI */
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/login")} className="px-4 font-headings text-sm">로그인</Button>
            <Button onClick={() => router.push("/signup")} className="px-6 rounded-pill bg-primary text-primary-foreground font-headings text-sm shadow-soft hover:shadow-md transition-all">시작하기</Button>
          </div>
        )}
      </div>
    </header>
  );
}
