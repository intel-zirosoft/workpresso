"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { LogOut, Menu } from "lucide-react";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // 표준 방식으로 단순화 (null 에러 해결)
  const router = useRouter();

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

  return (
    <header className="h-[72px] md:h-[96px] flex items-center justify-between md:justify-end px-4 md:px-10 sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
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
          /* 로그인 성공 UI */
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
