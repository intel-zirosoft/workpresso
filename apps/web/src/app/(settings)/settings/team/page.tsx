import { getUserProfile, getAllUsers } from '@/features/settings/services/userAction';
import { redirect } from 'next/navigation';
import { MemberManagement } from '@/features/settings/components/MemberManagement';

export default async function TeamSettingsPage() {
  const profile = await getUserProfile();
  
  // Strict check for administrative roles
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  // Fetch all users for management
  const users = await getAllUsers();

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-headings font-bold text-text">내 팀 관리</h1>
        <p className="text-sm text-muted mt-1 font-body">
          조직의 구성원을 확인하고 역할과 부서를 관리합니다.
        </p>
      </div>

      <MemberManagement 
        users={users} 
        currentUserId={profile.id} 
      />
    </div>
  );
}

