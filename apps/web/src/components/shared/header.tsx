"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_LABELS, THEME_OPTIONS, type ThemePreference } from "@/lib/theme";
import { useTheme } from "@/providers/theme-provider";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { themePreference, setThemePreference } = useTheme();
  const [supabase] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return createClient();
  });
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

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
  }, [supabase]);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.refresh();
  };

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);
  };

  return (
    <header className="h-16 flex items-center justify-end px-8 sticky top-0 bg-background/80 backdrop-blur-md z-50">
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-muted focus:text-text data-[state=open]:text-text">
                  <span>Theme</span>
                  <span className="ml-auto mr-2 text-xs font-semibold text-text/60">
                    {THEME_LABELS[themePreference]}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {THEME_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      className="cursor-pointer text-muted focus:text-text"
                      onClick={() => handleThemeChange(option)}
                    >
                      <span>{THEME_LABELS[option]}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 transition-opacity",
                          themePreference === option ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
