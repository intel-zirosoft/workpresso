"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="h-16 flex items-center justify-end px-8 sticky top-0 bg-background/80 backdrop-blur-md z-30">
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full shadow-sm">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(user.user_metadata?.name || user.email || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2 border-b border-background/50 mb-1">
                <p className="text-sm font-bold leading-none text-text">{user.user_metadata?.name || "User"}</p>
                <p className="text-xs leading-none text-muted">{user.email}</p>
              </div>
              <DropdownMenuItem className="cursor-pointer text-muted hover:text-text">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/login")} className="font-headings font-semibold text-muted hover:text-text">
              Log in
            </Button>
            <Button onClick={() => router.push("/signup")} className="font-headings font-bold shadow-soft">
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
