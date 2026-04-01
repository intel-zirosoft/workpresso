"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { APP_NAV_ITEMS, ADMIN_NAV_ITEMS, isActivePath, type AppNavItem } from "@/components/shared/navigation";
import { useCurrentUser } from "@/features/settings/hooks/use-current-user";

interface SidebarContentProps {
  onNavigate?: () => void;
  mobile?: boolean;
  appShell?: boolean;
}

const APP_SHELL_PRIMARY_HREFS = [
  "/documents",
  "/chatter",
  "/schedules",
  "/chat",
  "/voice",
] as const;

const APP_SHELL_SECONDARY_HREFS = ["/", "/teammates"] as const;

function getItemDescription(href: string) {
  switch (href) {
    case "/":
      return "오늘 업무 브리핑";
    case "/documents":
      return "승인·반려할 문서";
    case "/chatter":
      return "읽지 않은 채널과 브리핑";
    case "/schedules":
      return "오늘과 이번 주 일정";
    case "/chat":
      return "AI 업무 도우미";
    case "/voice":
      return "회의/음성 기록";
    case "/teammates":
      return "팀 상태 확인";
    default:
      return "";
  }
}

function getDisplayName(name: string | null, email: string | null) {
  if (name?.trim()) {
    return name;
  }

  if (email) {
    return email.split("@")[0];
  }

  return "팀원";
}

export function SidebarContent({
  onNavigate,
  mobile = false,
  appShell = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { data: currentUser } = useCurrentUser();
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ORG_ADMIN";
  const displayName = getDisplayName(currentUser?.name ?? null, currentUser?.email ?? null);
  const primaryAppShellItems = APP_SHELL_PRIMARY_HREFS.map(
    (href) => APP_NAV_ITEMS.find((item) => item.href === href)!,
  );
  const secondaryAppShellItems = APP_SHELL_SECONDARY_HREFS.map(
    (href) => APP_NAV_ITEMS.find((item) => item.href === href)!,
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate?.();
    router.refresh();
    router.push("/login");
  };

  return (
    <>
      <div
        className={cn(
          "border-background/50",
          mobile
            ? appShell
              ? "px-4 pb-3 pt-5"
              : "border-b px-5 py-5"
            : "p-8",
        )}
      >
        {appShell ? (
          <div className="rounded-[28px] bg-gradient-to-br from-primary/10 via-secondary/10 to-surface px-5 py-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
                  WorkPresso
                </p>
                <h2 className="mt-1 text-xl font-headings font-bold tracking-tight text-text">
                  안녕하세요, {displayName}님
                </h2>
                <p className="mt-1 text-sm font-medium text-text-muted">
                  승인 대기 문서와 오늘 일정을 빠르게 확인하세요.
                </p>
              </div>
              <Link
                href="/"
                onClick={onNavigate}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-text shadow-sm transition hover:text-primary"
                aria-label="홈으로 이동"
              >
                <Home size={18} />
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm">
                문서 결재
              </span>
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm">
                오늘 일정
              </span>
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm">
                팀 브리핑
              </span>
            </div>
          </div>
        ) : null}
        {!appShell ? (
          <Link
            href="/"
            onClick={onNavigate}
            className="text-2xl font-headings font-bold tracking-tight text-primary"
          >
            WorkPresso
          </Link>
        ) : null}
      </div>

      <nav
        className={cn(
          "flex-1",
          mobile
            ? appShell
              ? "space-y-5 px-4 py-3"
              : "space-y-1 px-3 py-4"
            : "space-y-2 px-4",
        )}
      >
        {appShell ? (
          <>
            <div>
              <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted/70">
                빠른 이동
              </p>
              <div className="mt-3 space-y-3">
                {primaryAppShellItems.map((item: AppNavItem) => {
                  const isActive = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-[28px] px-4 py-4 shadow-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/8 text-primary shadow-soft"
                          : "bg-surface text-text-muted hover:bg-primary/5 hover:text-text",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          isActive
                            ? "bg-primary/12 text-primary"
                            : "bg-background/70 text-text-muted group-hover:text-text",
                        )}
                      >
                        <item.icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-headings font-semibold text-inherit">
                          {item.name}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            isActive ? "text-primary/70" : "text-text-muted/80",
                          )}
                        >
                          {getItemDescription(item.href)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted/70">
                기타
              </p>
              <div className="mt-3 space-y-2">
                {secondaryAppShellItems.map((item: AppNavItem) => {
                  const isActive = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200",
                        isActive
                          ? "bg-primary/8 text-primary"
                          : "bg-surface text-text-muted hover:bg-primary/5 hover:text-text",
                      )}
                    >
                      <item.icon
                        size={18}
                        className={cn(
                          isActive ? "text-primary" : "text-text-muted group-hover:text-text",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-headings font-medium">{item.name}</span>
                        <p className="mt-0.5 text-xs text-text-muted/80">
                          {getItemDescription(item.href)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : APP_NAV_ITEMS.map((item: AppNavItem) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 transition-all duration-200",
                mobile
                  ? appShell
                    ? "rounded-3xl border px-4 py-4 shadow-sm"
                    : "rounded-2xl px-4 py-3.5"
                  : "rounded-pill px-4 py-3",
                isActive
                  ? appShell
                    ? "border-primary/10 bg-primary/8 text-primary shadow-soft"
                    : "bg-primary text-primary-foreground shadow-soft"
                  : appShell
                    ? "border-background/60 bg-surface text-text-muted hover:border-primary/20 hover:bg-primary/5 hover:text-text"
                    : "text-text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  isActive
                    ? appShell
                      ? "text-primary"
                      : "text-primary-foreground"
                    : "text-text-muted group-hover:text-text",
                )}
              />
              <div className="min-w-0 flex-1">
                <span className="font-headings font-medium">{item.name}</span>
                {appShell ? (
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      isActive ? "text-primary/70" : "text-text-muted/80",
                    )}
                  >
                    {item.href === "/"
                      ? "오늘 업무 브리핑"
                      : item.href === "/documents"
                        ? "승인·검토 문서"
                        : item.href === "/chat"
                          ? "AI 업무 도우미"
                          : item.href === "/chatter"
                            ? "팀 채널과 브리핑"
                            : item.href === "/teammates"
                              ? "팀 상태 확인"
                              : item.href === "/schedules"
                                ? "오늘과 이번 주 일정"
                                : "회의/음성 기록"}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto space-y-2 border-t border-background/50",
          mobile ? "p-3" : "p-6",
        )}
      >
        {isAdmin && ADMIN_NAV_ITEMS.map((item: AppNavItem) => {
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 transition-all duration-200",
                mobile
                  ? appShell
                    ? "rounded-3xl border px-4 py-4 shadow-sm"
                    : "rounded-2xl px-4 py-3.5"
                  : "rounded-pill px-4 py-3",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : appShell
                    ? "border-background/60 bg-surface text-text-muted hover:border-primary/20 hover:bg-primary/5 hover:text-text"
                    : "text-text-muted hover:bg-background hover:text-text"
              )}
            >
              <item.icon
                size={20}
                className={cn(isActive ? "text-primary" : "text-text-muted group-hover:text-text")}
              />
              <span className="font-headings font-medium">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleSignOut}
          className={cn(
            "group flex w-full items-center gap-3 px-4 py-3 text-text-muted transition-all duration-200 hover:bg-destructive/10 hover:text-destructive",
            appShell ? "rounded-3xl border border-background/60 bg-surface shadow-sm" : "rounded-pill",
          )}
        >
          <LogOut size={20} />
          <span className="font-headings font-medium">로그아웃</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[260px] h-screen sticky top-0 bg-surface border-r border-transparent shadow-soft flex flex-col z-40">
      <SidebarContent />
    </aside>
  );
}
