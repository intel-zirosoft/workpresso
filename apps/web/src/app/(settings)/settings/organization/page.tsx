import { getUserProfile, getAllUsers } from '@/features/settings/services/userAction';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { redirect } from 'next/navigation';
import { Building2, Users2, ShieldCheck, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function OrganizationSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  const allUsers = await getAllUsers();

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headings font-bold text-text flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> 워크스페이스 관리
          </h1>
          <p className="text-sm text-muted mt-1 font-body">
            조직 내 모든 사용자 계정과 권한을 한눈에 관리하고 조율할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-pill shadow-soft border border-background">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-pill border border-primary/10">
            <Users2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{allUsers.length}</span>
            <span className="text-[11px] text-muted font-bold uppercase tracking-wider">Members</span>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white border border-background shadow-soft rounded-3xl overflow-hidden transition-all hover:shadow-md">
        <div className="p-6 border-b border-background flex items-center justify-between gap-4 bg-primary/5">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input className="rounded-pill pl-10 h-10 border-transparent bg-white shadow-soft focus:ring-primary/10" placeholder="사용자 이름 또는 이메일 검색..." />
          </div>
          <Button variant="outline" size="sm" className="rounded-pill px-4 h-10 border-background bg-white shadow-soft text-muted hover:text-primary gap-2 font-bold">
            <Filter className="w-3.5 h-3.5" /> 필터링
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-muted text-[11px] uppercase tracking-widest font-bold font-headings border-b border-background">
                <th className="px-8 py-5">이름 및 부서</th>
                <th className="px-8 py-5">연락처 및 이메일</th>
                <th className="px-8 py-5">부여된 권한</th>
                <th className="px-8 py-5 text-right">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background font-body">
              {allUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-primary/[0.02] active:bg-primary/[0.04] transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-text group-hover:text-primary transition-colors">{user.name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{user.department || '부서 미지정'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-medium text-muted-foreground">
                    {user.email || 'noreply@workpresso.com'}
                  </td>
                  <td className="px-8 py-5">
                    <UserRoleBadge role={user.role || 'USER'} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button variant="ghost" className="rounded-pill px-6 h-9 hover:bg-primary/5 text-primary font-bold text-xs transition-all border border-transparent hover:border-primary/10">
                      상세 보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Quick Help */}
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-primary">도움말:</span> 최고 관리자 권한으로 멤버 정보를 수정할 경우, 해당 멤버의 모든 시스템 접근 권한이 즉시 재평가됩니다.
        </p>
      </div>
    </div>
  );
}

