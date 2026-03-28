import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, Shield, User } from 'lucide-react';

interface UserRoleBadgeProps {
  role: string;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <Badge variant="destructive" className="gap-1 rounded-full px-3 py-1 font-medium bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
          <ShieldAlert className="w-3.5 h-3.5" /> 최고 관리자
        </Badge>
      );
    case 'ORG_ADMIN':
      return (
        <Badge variant="default" className="gap-1 rounded-full px-3 py-1 font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5" /> 조직 관리자
        </Badge>
      );
    case 'TEAM_ADMIN':
      return (
        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1 font-medium bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
          <Shield className="w-3.5 h-3.5" /> 팀 관리자
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 rounded-full px-3 py-1 font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200">
          <User className="w-3.5 h-3.5" /> 일반 사용자
        </Badge>
      );
  }
}
