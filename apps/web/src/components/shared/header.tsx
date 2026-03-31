"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  Check,
  LogOut,
  Menu,
  Moon,
  Palette,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarContent } from "@/components/shared/sidebar";
import { getCurrentSectionTitle } from "@/components/shared/navigation";
import {
  THEME_VISUAL_PRESET_LABELS,
  type ThemeVisualPreset,
} from "@/lib/theme";
import { LiquidGlassFrame } from "@/components/theme/liquid-glass-frame";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

const presetDescriptions: Record<ThemeVisualPreset, string> = {
  classic: "기존 Workpresso 톤을 유지합니다.",
  "liquid-glass": "쿨 슬레이트 기반 글래스 스타일을 적용합니다.",
};

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const currentSectionTitle = getCurrentSectionTitle(pathname);
  const { resolvedTheme, setThemePreference, themePreset, setThemePreset } =
    useTheme();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
    retry: 1,
    enabled: !!user,
  });

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser();
      if (initialUser) {
        setUser(initialUser);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return (
    <header className="app-shell-header sticky top-0 z-30 flex h-[72px] items-center justify-between bg-background/80 px-4 backdrop-blur-md md:h-[96px] md:px-10">
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
              <DialogDescription>
                서비스의 주요 화면으로 이동합니다.
              </DialogDescription>
            </div>
            <div className="flex h-full flex-col">
              <SidebarContent
                mobile
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            Workspace
          </p>
          <h1 className="truncate font-headings text-lg font-bold text-text md:text-2xl">
            {currentSectionTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-none bg-transparent p-0 shadow-none"
              aria-label="스타일 프리셋 변경"
            >
              <LiquidGlassFrame
                interactive
                padding="10px 14px"
                cornerRadius={999}
                className="inline-flex items-center gap-2 rounded-pill border border-background/60 bg-surface/80 text-sm font-semibold text-text shadow-soft transition-all hover:bg-surface"
              >
                {themePreset === "liquid-glass" ? (
                  <Sparkles className="h-4 w-4 text-primary" />
                ) : (
                  <Palette className="h-4 w-4 text-primary" />
                )}
                <span className="hidden sm:inline">
                  {THEME_VISUAL_PRESET_LABELS[themePreset]}
                </span>
              </LiquidGlassFrame>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
            <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-text-muted">
              스타일 프리셋
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["classic", "liquid-glass"] as ThemeVisualPreset[]).map(
              (preset) => {
                const isActive = themePreset === preset;

                return (
                  <DropdownMenuItem
                    key={preset}
                    onClick={() => setThemePreset(preset)}
                    className="rounded-xl px-3 py-3"
                  >
                    <div className="flex w-full items-start gap-3">
                      <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                        {preset === "liquid-glass" ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <Palette className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text">
                          {THEME_VISUAL_PRESET_LABELS[preset]}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-text-muted">
                          {presetDescriptions[preset]}
                        </p>
                      </div>
                      {isActive ? (
                        <Check className="mt-1 h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                  </DropdownMenuItem>
                );
              },
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label={isDarkMode ? "라이트 테마로 변경" : "다크 테마로 변경"}
          onClick={handleThemeToggle}
          className="hidden border-none bg-transparent p-0 shadow-none sm:flex"
        >
          <LiquidGlassFrame
            interactive
            padding="8px 12px"
            cornerRadius={999}
            className="flex items-center gap-2.5 rounded-pill border border-background/60 bg-surface/80 shadow-soft transition-colors hover:bg-surface"
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
          </LiquidGlassFrame>
        </button>

        {loading || (user && isProfileLoading) ? (
          <div className="flex items-center gap-3 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-2 w-12 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 rounded-md border border-background/50 bg-surface/70 p-2 shadow-soft backdrop-blur-sm transition-all hover:bg-surface md:gap-3 md:pr-4">
            <Avatar className="h-9 w-9 border border-primary/10 shadow-sm">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || user.email}`}
              />
              <AvatarFallback className="bg-secondary/30 text-xs font-bold text-primary">
                {(profile?.name || user.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-[120px] flex-col md:flex">
              <div className="flex items-center gap-2">
                <p className="max-w-[100px] truncate text-sm font-bold leading-tight text-text">
                  {profile?.name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0]}
                </p>
                {profile?.role && (
                  <UserRoleBadge
                    role={profile.role}
                    className="origin-left scale-75"
                  />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-[10px] font-medium leading-tight text-text-muted">
                  {profile?.department || "구성원"}
                </p>
                <span className="h-1 w-1 rounded-full bg-muted/30" />
                <p className="text-[10px] font-medium leading-tight text-primary/60">
                  {user.email}
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
              className="rounded-pill px-6 font-headings text-sm text-white shadow-soft transition-all hover:shadow-md"
            >
              시작하기
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
