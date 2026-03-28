"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { LogOut, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/settings/services/userAction";
import { UserRoleBadge } from "@/features/settings/components/UserRoleBadge";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(),
    retry: 1,
    enabled: !!user,
  });

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

  return (
    <header className="h-[72px] md:h-[96px] flex items-center justify-between md:justify-end px-4 md:px-10 sticky top-0 bg-background/80 backdrop-blur-md z-30">
      {/* Mobile Menu */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon" className="text-primary">
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {loading || (user && isProfileLoading) ? (
          <div className="flex items-center gap-3 p-2 rounded-md bg-white/50 shadow-soft border border-background/50">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-2 w-12 bg-muted/50 animate-pulse rounded" />
            </div>
          </div>
        ) : user ? (
          /* 로그인 성공 UI */
          <div className="flex items-center gap-3 p-2 pr-4 rounded-md bg-white/50 shadow-soft border border-background/50 backdrop-blur-sm transition-all hover:bg-white/80">
            <Avatar className="h-9 w-9 shadow-sm border border-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || user.email}`} />
              <AvatarFallback className="bg-secondary/30 text-primary font-bold text-xs">
                {(profile?.name || user.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-[120px]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text leading-tight truncate max-w-[100px]">
                  {profile?.name || user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                {profile?.role && (
                  <UserRoleBadge role={profile.role} className="scale-75 origin-left" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] font-medium text-muted/80 leading-tight">
                  {profile?.department || "구성원"}
                </p>
                <span className="w-1 h-1 rounded-full bg-muted/30" />
                <p className="text-[10px] font-medium text-primary/60 leading-tight">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-background/50 mx-1" />
            <button 
              onClick={handleSignOut}
              className="text-muted hover:text-destructive transition-all p-1.5 hover:bg-destructive/10 rounded-full"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* 로그인 필요 UI */
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/login")} className="px-4 font-headings text-sm">로그인</Button>
            <Button onClick={() => router.push("/signup")} className="px-6 rounded-pill bg-primary text-white font-headings text-sm shadow-soft hover:shadow-md transition-all">시작하기</Button>
          </div>
        )}
      </div>
    </header>
  );
}
