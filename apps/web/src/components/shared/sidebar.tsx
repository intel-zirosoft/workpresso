"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MessageSquare, Users, Layout, Bot, Settings, LogOut, Calendar, FileText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Work Assistant", href: "/chat", icon: Bot }, // Pod C: AI Agent
  { name: "Chatter", href: "/chatter", icon: MessageSquare },
  { name: "Teammates", href: "/teammates", icon: Users },
  { name: "Canvas", href: "/canvas", icon: Layout },
  { name: "Schedules", href: "/schedules", icon: Calendar },
  { name: "Voice", href: "/voice", icon: Mic }, // Pod D: Meeting Logs
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
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
    router.push("/login");
  };

  return (
    <aside className="w-[260px] h-screen sticky top-0 bg-surface border-r border-transparent shadow-soft flex flex-col z-40">
      {/* Logo / Wordmark */}
      <div className="p-8">
        <Link href="/" className="text-2xl font-headings font-bold text-primary tracking-tight">
          WorkPresso
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-pill transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-soft" 
                  : "text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-muted group-hover:text-text")} />
              <span className="font-headings font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile / Bottom Menu - Removed as it moved to Header */}
    </aside>
  );
}
