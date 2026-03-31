"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/features/settings/services/userAction";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function UserProgressCard() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase.auth]);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => getUserProfile(),
    enabled: !!user,
  });

  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "김지우";
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${userName}`;

  return (
    <div className="rounded-[24px] bg-primary/10 p-5 shadow-sm border border-primary/20 relative overflow-hidden group hover:shadow-md transition-shadow">
      {/* Decorative gradient blur in background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/30 transition-colors" />

      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-surface shadow-sm ring-1 ring-primary/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {userName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-headings text-lg font-bold text-text mb-0.5 tracking-tight">
              {userName} 님
            </h3>
            <p className="text-[11px] font-medium text-text-muted leading-tight">
              오늘 3개의 문서가 작성되었습니다.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="w-full bg-background/60 rounded-full h-1.5 shadow-inner overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full w-2/3 shadow-[inset_0_1px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out"
              style={{ width: '66%' }}
            />
          </div>
          <p className="mt-2 text-right text-[10px] font-bold text-primary tracking-wide">
            일일 목표 66% 달성
          </p>
        </div>
      </div>
    </div>
  );
}
