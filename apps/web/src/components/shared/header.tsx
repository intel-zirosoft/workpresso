"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // 표준 방식으로 단순화 (null 에러 해결)
  const router = useRouter();
  const { resolvedTheme, setThemePreference } = useTheme();

  // 부서 정보를 가져오는 별도의 비동기 함수
  const loadDepartment = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('department')
        .eq('id', userId)
        .maybeSingle();
      if (data?.department) setDepartment(data.department);
    } catch (e) {
      console.warn("Could not load department from DB");
    }
  }, [supabase]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      if (initialUser) {
        setUser(initialUser);
        // 메타데이터에 이미 있다면 우선 설정
        setDepartment(initialUser.user_metadata?.department || initialUser.user_metadata?.position || null);
        loadDepartment(initialUser.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setDepartment(currentUser.user_metadata?.department || currentUser.user_metadata?.position || null);
        loadDepartment(currentUser.id);
      } else {
        setDepartment(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadDepartment]);

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
    <header className="h-[72px] md:h-[96px] flex items-center justify-between md:justify-end px-4 md:px-10 sticky top-0 bg-background/80 backdrop-blur-md">
      {/* Mobile Menu */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon" className="text-primary">
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label={isDarkMode ? "라이트 테마로 변경" : "다크 테마로 변경"}
              onClick={handleThemeToggle}
              className="flex items-center gap-3 rounded-pill border border-background/60 bg-white/60 px-3 py-2 shadow-soft transition-colors hover:bg-white/80"
            >
              <Sun
                className={cn(
                  "h-4 w-4 transition-colors",
                  isDarkMode ? "text-text-muted" : "text-primary",
                )}
              />
              <span
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  isDarkMode ? "bg-primary/20" : "bg-secondary/80",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-primary shadow-sm transition-transform",
                    isDarkMode ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </span>
              <Moon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isDarkMode ? "text-primary" : "text-text-muted",
                )}
              />
              <span className="hidden w-10 shrink-0 text-center text-xs font-semibold text-text-muted sm:inline-block">
                {isDarkMode ? "다크" : "라이트"}
              </span>
            </button>

            <div className="flex items-center gap-3 p-2 rounded-md bg-white/50 shadow-soft border border-background/50">
              <Avatar className="h-9 w-9 shadow-sm">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-secondary/30 text-primary font-bold text-xs">
                  {(user.user_metadata?.name || user.email || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-[100px]">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-sm font-bold text-text leading-tight">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] font-medium text-primary/70 leading-tight">
                    {department || "구성원"}
                  </p>
                </div>
                <p className="hidden md:block text-[10px] md:text-[11px] font-medium text-muted leading-tight mt-0.5">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={handleSignOut}
                className="ml-2 text-muted hover:text-destructive transition-colors p-1.5 hover:bg-destructive/10 rounded-full"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </>
        ) : (
          /* 로그인 필요 UI */
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/login")} className="px-4">로그인</Button>
            <Button onClick={() => router.push("/signup")} className="px-6 rounded-pill bg-primary text-white">시작하기</Button>
          </div>
        )}
      </div>
    </header>
  );
}
