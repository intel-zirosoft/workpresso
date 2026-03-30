import { getUserProfile } from '@/features/settings/services/userAction';
import { SettingsSidebar } from '@/features/settings/components/SettingsSidebar';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  try {
    profile = await getUserProfile();
  } catch (e) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <SettingsSidebar userRole={profile?.role || 'USER'} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-[24px] shadow-sm p-8 border border-border/50 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
