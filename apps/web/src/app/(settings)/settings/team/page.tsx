import { getUserProfile } from '@/features/settings/services/userAction';
import { redirect } from 'next/navigation';

export default async function TeamSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN' && profile.role !== 'TEAM_ADMIN') {
    redirect('/settings/profile');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headings font-bold text-foreground">내 팀 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">소속 팀의 정보를 관리합니다.</p>
      </div>

      <div className="p-8 text-center text-muted-foreground bg-primary/5 rounded-2xl border border-dashed border-primary/20">
        <p>팀원 관리 기능은 구현 준비 중입니다.</p>
      </div>
    </div>
  );
}
