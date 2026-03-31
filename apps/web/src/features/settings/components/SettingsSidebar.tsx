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

  const normalizedRole = (userRole || 'USER').trim().toUpperCase();
  const filteredItems = navItems.filter(item => item.allowedRoles.includes(normalizedRole));

  return (
    <>
      <nav className="-mx-4 overflow-x-auto pb-2 md:hidden">
        <div className="flex min-w-max gap-2 px-4">
          {filteredItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-bold transition-all',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-background/70 bg-surface text-text-muted hover:border-primary/20 hover:text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="app-settings-nav hidden min-h-[calc(100vh-4rem)] w-64 flex-col gap-2 border-r border-background/50 bg-surface p-6 md:flex">
        <h2 className="mb-8 px-2 text-xl font-headings font-bold tracking-tight text-text">설정</h2>
        <div className="flex flex-col gap-2">
          {filteredItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3.5 font-headings text-sm font-bold transition-all duration-300',
                  isActive
                    ? 'translate-x-1 bg-primary text-primary-foreground shadow-md'
                    : 'text-text-muted hover:translate-x-1 hover:bg-primary/5 hover:text-primary'
                )}
              >
                <div className={cn(
                  'rounded-lg p-1.5 transition-colors duration-300',
                  isActive ? 'bg-white/20' : 'bg-primary/5 text-primary group-hover:bg-primary/10'
                )}>
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-primary')} />
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
