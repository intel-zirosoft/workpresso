import { getUserProfile, getAllUsers } from '@/features/settings/services/userAction';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { redirect } from 'next/navigation';

export default async function OrganizationSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  const allUsers = await getAllUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headings font-bold text-foreground">조직 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">워크스페이스 내 모든 팀과 권한을 관리합니다.</p>
      </div>
      
      <div className="border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary/5 text-foreground/80 text-xs uppercase font-medium border-b">
            <tr>
              <th className="px-6 py-4">이름</th>
              <th className="px-6 py-4">부서/팀</th>
              <th className="px-6 py-4">권한</th>
              <th className="px-6 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-background font-body">
            {allUsers.map((user: any) => (
              <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.department || '팀 없음'}</td>
                <td className="px-6 py-4"><UserRoleBadge role={user.role || 'USER'} /></td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:underline font-medium text-sm">수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
