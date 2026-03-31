"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { LogOut, Menu, Settings } from "lucide-react";
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

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const currentSectionTitle = getCurrentSectionTitle(pathname);

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
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-background/80 px-4 backdrop-blur-md md:h-[96px] md:px-10">
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
          <h1 className="truncate font-headings text-lg font-bold text-text md:text-2xl">
            {currentSectionTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
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
          <div className="flex items-center gap-2 rounded-md border border-background/50 bg-white/50 p-2 shadow-soft backdrop-blur-sm transition-all hover:bg-white/80 md:gap-3 md:pr-4">
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
                <p className="text-[10px] font-medium text-muted/80 leading-tight">
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
                onClick={() => router.push("/settings/profile")}
                className="text-muted hover:text-primary transition-all p-1.5 hover:bg-primary/10 rounded-full"
                title="설정"
                aria-label="설정으로 이동"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSignOut}
                className="text-muted hover:text-destructive transition-all p-1.5 hover:bg-destructive/10 rounded-full"
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
            <Button onClick={() => router.push("/signup")} className="px-6 rounded-pill bg-primary text-white font-headings text-sm shadow-soft hover:shadow-md transition-all">시작하기</Button>
          </div>
        )}
      </div>
    </header>
  );
}
