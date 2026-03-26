"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getFullUserData = async () => {
      // 1. Auth 유저 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 2. DB의 users 테이블에서 부서(department) 정보 가져오기
        const { data: dbUser } = await supabase
          .from('users')
          .select('department')
          .eq('id', user.id)
          .single();
        
        if (dbUser) {
          setDepartment(dbUser.department);
        }
      }
      setLoading(false);
    };

    getFullUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('department')
            .eq('id', currentUser.id)
            .single();
          setDepartment(dbUser?.department ?? null);
        } else {
          setDepartment(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="h-[72px] md:h-[96px] flex items-center justify-between md:justify-end px-4 md:px-10 sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon" className="text-primary">
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-md bg-white/50 shadow-soft border border-background/50">
            <Avatar className="h-8 w-8 md:h-9 md:w-9 shadow-sm">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || "User"} />
              <AvatarFallback className="bg-secondary/30 text-primary font-bold text-xs">
                {(user.user_metadata?.name || user.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 md:min-w-[120px]">
              <div className="flex items-baseline gap-1.5">
                <p className="text-xs md:text-sm font-bold text-text leading-tight truncate max-w-[80px] md:max-w-none">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] md:text-[11px] font-medium text-primary/70 leading-tight shrink-0">
                  {department || "소속 없음"}
                </p>
              </div>
              <p className="hidden md:block text-[10px] md:text-[11px] font-medium text-muted leading-tight truncate mt-0.5">
                {user.email}
              </p>
            </div>
            <button 
              onClick={handleSignOut}
              className="ml-1 md:ml-2 text-muted hover:text-destructive transition-colors p-1 md:p-1.5 hover:bg-destructive/10 rounded-full"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/login")} className="font-headings font-semibold text-muted hover:text-text">
              로그인
            </Button>
            <Button onClick={() => router.push("/signup")} className="font-headings font-bold shadow-soft bg-primary hover:bg-primary/90 text-white">
              시작하기
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
