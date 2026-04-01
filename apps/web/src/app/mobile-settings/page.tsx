import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building,
  ChevronRight,
  Link2,
  Settings as SettingsIcon,
  Shield,
  User,
  Users,
} from "lucide-react";

import { getUserProfile } from "@/features/settings/services/userAction";

type MobileSettingsItem = {
  description: string;
  href: string;
  icon: typeof User;
  title: string;
};

function getMobileSettingsItems(role: string | null): MobileSettingsItem[] {
  const normalizedRole = (role || "USER").trim().toUpperCase();
  const items: MobileSettingsItem[] = [
    {
      title: "내 프로필",
      description: "이름, 소속 등 기본 정보를 확인하고 수정합니다.",
      href: "/settings/profile",
      icon: User,
    },
  ];

  if (
    normalizedRole === "TEAM_ADMIN" ||
    normalizedRole === "ORG_ADMIN" ||
    normalizedRole === "SUPER_ADMIN"
  ) {
    items.push({
      title: "내 팀 관리",
      description: "팀 구성과 팀원 상태를 확인합니다.",
      href: "/settings/team",
      icon: Users,
    });
  }

  if (normalizedRole === "ORG_ADMIN" || normalizedRole === "SUPER_ADMIN") {
    items.push({
      title: "외부 연동",
      description: "Jira, Slack, AI 연동 설정을 관리합니다.",
      href: "/settings/integrations",
      icon: Link2,
    });
    items.push({
      title: "조직 관리",
      description: "조직 구조와 팀 구성을 관리합니다.",
      href: "/settings/organization",
      icon: Building,
    });
  }

  if (normalizedRole === "SUPER_ADMIN") {
    items.push({
      title: "시스템 설정",
      description: "플랫폼 수준 설정과 운영 옵션을 조정합니다.",
      href: "/settings/system",
      icon: SettingsIcon,
    });
  }

  return items;
}

function getRoleLabel(role: string | null) {
  switch ((role || "USER").trim().toUpperCase()) {
    case "TEAM_ADMIN":
      return "팀 관리자";
    case "ORG_ADMIN":
      return "조직 관리자";
    case "SUPER_ADMIN":
      return "최고 관리자";
    default:
      return "구성원";
  }
}

export default async function MobileSettingsPage() {
  let profile;

  try {
    profile = await getUserProfile();
  } catch {
    redirect("/login");
  }

  const items = getMobileSettingsItems(profile?.role ?? null);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col gap-5 px-1 py-2">
      <section className="rounded-[32px] bg-gradient-to-br from-primary/12 via-secondary/10 to-surface p-6 shadow-soft">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/70">
          Mobile Settings
        </p>
        <h1 className="mt-2 text-3xl font-headings font-bold tracking-tight text-text">
          설정
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          앱에서는 자주 쓰는 개인 설정과 권한 범위 안의 관리 기능만 빠르게
          접근할 수 있도록 구성합니다.
        </p>

        <div className="mt-5 rounded-[28px] bg-surface/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-headings font-bold text-text">
                {profile?.name || "사용자"}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {profile?.email || "이메일 정보 없음"}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              {getRoleLabel(profile?.role ?? null)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-text-muted">
            <Shield className="h-4 w-4 text-primary" />
            <span>
              권한에 맞는 설정만 노출됩니다.
              {profile?.department ? ` · ${profile.department}` : ""}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-text-muted/70">
            빠른 설정
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-[28px] bg-surface px-5 py-5 shadow-soft transition hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-headings text-base font-bold text-text">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-text-muted">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] bg-surface px-5 py-5 shadow-soft">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-text-muted/70">
          앱 사용 기준
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-6 text-text-muted">
          <p>• 앱에서는 빠른 확인과 즉시 처리에 필요한 설정만 우선 제공합니다.</p>
          <p>• 복잡한 관리 작업은 필요한 경우 상세 설정 화면에서 이어서 처리합니다.</p>
          <p>• 그룹웨어 핵심 흐름을 방해하지 않도록 설정 화면은 단순한 카드 구조로 유지합니다.</p>
        </div>
      </section>
    </div>
  );
}
