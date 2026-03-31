"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarContent } from "@/components/shared/sidebar";
import { UserRoleBadge } from "@/features/settings/components/UserRoleBadge";
import { useCurrentUser } from "@/features/settings/hooks/use-current-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { getCurrentSectionTitle } from "@/components/shared/navigation";

export function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { resolvedTheme, setThemePreference } = useTheme();
  const { data: currentUser, isLoading } = useCurrentUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.setQueryData(["currentUser"], null);
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
              className="text-primary md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 h-full w-[min(88vw,320px)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-none bg-surface p-0 shadow-2xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
            <div className="sr-only">
              <DialogTitle>주 메뉴</DialogTitle>
              <DialogDescription>서비스의 주요 화면으로 이동합니다.</DialogDescription>
            </div>
            <div className="flex h-full flex-col">
              <SidebarContent mobile onNavigate={() => setMobileNavOpen(false)} />
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
                isDarkMode ? "text-text-muted" : "text-primary",
              )}
            />
          </span>
          <span
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              isDarkMode ? "bg-primary/20" : "bg-secondary/80",
            )}
          >
            <span
              className={cn(
                "absolute left-1 top-1 h-5 w-5 rounded-full bg-primary shadow-sm transition-transform",
                isDarkMode ? "translate-x-6" : "translate-x-0",
              )}
            />
          </span>
          <span className="flex h-5 w-5 items-center justify-center">
            <Moon
              className={cn(
                "h-4 w-4 transition-colors",
                isDarkMode ? "text-primary" : "text-text-muted",
              )}
            />
          </span>
          <span className="hidden w-10 shrink-0 text-center text-xs font-semibold text-text-muted lg:inline-block">
            {isDarkMode ? "다크" : "라이트"}
          </span>
        </button>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-2 w-12 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        ) : currentUser ? (
          <div className="flex items-center gap-2 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft backdrop-blur-sm transition-all hover:bg-surface md:gap-3 md:pr-4">
            <Avatar className="h-9 w-9 border border-primary/10 shadow-sm">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser.name || currentUser.email}`}
              />
              <AvatarFallback className="bg-secondary/30 text-xs font-bold text-primary">
                {(currentUser.name || currentUser.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-[120px] flex-col md:flex">
              <div className="flex items-center gap-2">
                <p className="max-w-[100px] truncate text-sm font-bold leading-tight text-text">
                  {currentUser.name || currentUser.email?.split("@")[0]}
                </p>
                {currentUser.role && (
                  <UserRoleBadge role={currentUser.role} className="origin-left scale-75" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-[10px] font-medium leading-tight text-text-muted">
                  {currentUser.department || "구성원"}
                </p>
                <span className="h-1 w-1 rounded-full bg-muted/30" />
                <p className="text-[10px] font-medium leading-tight text-primary/60">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <div className="mx-1 hidden h-8 w-[1px] bg-background/50 md:block" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push("/settings/integrations")}
                className="rounded-full p-1.5 text-text-muted transition-all hover:bg-primary/10 hover:text-primary"
                title="설정"
                aria-label="설정으로 이동"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-full p-1.5 text-text-muted transition-all hover:bg-destructive/10 hover:text-destructive"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="px-4 font-headings text-sm"
            >
              로그인
            </Button>
            <Button
              onClick={() => router.push("/signup")}
              className="rounded-pill bg-primary px-6 font-headings text-sm text-primary-foreground shadow-soft transition-all hover:shadow-md"
            >
              시작하기
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
