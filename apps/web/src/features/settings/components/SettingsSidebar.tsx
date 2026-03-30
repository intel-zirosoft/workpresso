'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Users, Building, Link2, Settings as SettingsIcon } from 'lucide-react';

interface SettingsSidebarProps {
  userRole: string;
}

export function SettingsSidebar({ userRole }: SettingsSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: '내 프로필', href: '/settings/profile', icon: User, allowedRoles: ['USER', 'TEAM_ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN'] },
    { name: '내 팀 관리', href: '/settings/team', icon: Users, allowedRoles: ['TEAM_ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN'] },
    { name: '조직 관리', href: '/settings/organization', icon: Building, allowedRoles: ['ORG_ADMIN', 'SUPER_ADMIN'] },
    { name: '외부 연동', href: '/settings/integrations', icon: Link2, allowedRoles: ['ORG_ADMIN', 'SUPER_ADMIN'] },
    { name: '시스템 설정', href: '/settings/system', icon: SettingsIcon, allowedRoles: ['SUPER_ADMIN'] },
  ];

  // 권한 문자열 정규화 (공백 제거, 대문자 변환)
  const normalizedRole = (userRole || 'USER').trim().toUpperCase();
  const filteredItems = navItems.filter(item => item.allowedRoles.includes(normalizedRole));

  return (
    <>
      <nav className="md:hidden -mx-4 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2 px-4">
          {filteredItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-background/70 bg-white text-muted hover:border-primary/20 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="hidden w-64 min-h-[calc(100vh-4rem)] flex-col gap-2 border-r border-gray-100 bg-white p-6 md:flex">
        <h2 className="mb-8 px-2 text-xl font-headings font-bold tracking-tight text-gray-900">설정</h2>
        <div className="flex flex-col gap-2">
        {filteredItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-headings text-sm font-bold group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md translate-x-1" 
                  : "text-muted hover:bg-primary/5 hover:text-primary hover:translate-x-1"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors duration-300",
                isActive ? "bg-white/20" : "bg-primary/5 group-hover:bg-primary/10 text-primary"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-primary")} />
              </div>
              <span className="flex-1">{item.name}</span>
            </Link>
          );
        })}
        </div>
      </nav>
    </>
  );
}
