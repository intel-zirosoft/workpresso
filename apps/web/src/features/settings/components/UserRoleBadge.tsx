import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRoleBadgeProps {
  role: string;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <Badge variant="destructive" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-destructive-soft text-destructive hover:bg-destructive/15 border-destructive/20", className)}>
          <ShieldAlert className="w-3.5 h-3.5" /> 최고 관리자
        </Badge>
      );
    case 'ORG_ADMIN':
      return (
        <Badge variant="default" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-info-soft text-info hover:bg-info/15 border-info/20", className)}>
          <ShieldCheck className="w-3.5 h-3.5" /> 조직 관리자
        </Badge>
      );
    case 'TEAM_ADMIN':
      return (
        <Badge variant="secondary" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-success-soft text-success hover:bg-success/15 border-success/20", className)}>
          <Shield className="w-3.5 h-3.5" /> 팀 관리자
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-background text-text-muted hover:bg-surface-muted border-border", className)}>
          <User className="w-3.5 h-3.5" /> 일반 사용자
        </Badge>
      );
  }
}
