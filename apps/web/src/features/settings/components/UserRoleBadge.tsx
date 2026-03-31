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
        <Badge variant="destructive" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-red-100 text-red-700 hover:bg-red-200 border-red-200", className)}>
          <ShieldAlert className="w-3.5 h-3.5" /> 최고 관리자
        </Badge>
      );
    case 'ORG_ADMIN':
      return (
        <Badge variant="default" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", className)}>
          <ShieldCheck className="w-3.5 h-3.5" /> 조직 관리자
        </Badge>
      );
    case 'TEAM_ADMIN':
      return (
        <Badge variant="secondary" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-green-100 text-green-700 hover:bg-green-200 border-green-200", className)}>
          <Shield className="w-3.5 h-3.5" /> 팀 관리자
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("gap-1 rounded-full px-3 py-1 font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200", className)}>
          <User className="w-3.5 h-3.5" /> 일반 사용자
        </Badge>
      );
  }
}
