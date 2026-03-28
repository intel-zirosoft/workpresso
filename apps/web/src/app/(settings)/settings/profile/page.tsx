import { getUserProfile, updateUserProfile } from '@/features/settings/services/userAction';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { revalidatePath } from 'next/cache';

export default async function ProfileSettingsPage() {
  const profile = await getUserProfile();

  async function updateProfile(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const department = formData.get('department') as string;
    
    if (name) {
      await updateUserProfile(name, department);
      revalidatePath('/settings/profile');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headings font-bold text-foreground">내 프로필</h1>
        <p className="text-sm text-muted-foreground mt-1">개인 정보 및 표시 이름을 설정합니다.</p>
      </div>
      
      <div className="flex items-center gap-4 py-4 px-6 bg-primary/5 rounded-2xl border border-primary/10">
        <div>
          <p className="text-sm font-medium mb-1">현재 부여된 시스템 권한</p>
          <UserRoleBadge role={profile.role || 'USER'} />
        </div>
      </div>

      <form action={updateProfile} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="name">이름 (표시명)</Label>
          <Input id="name" name="name" defaultValue={profile.name} required className="rounded-xl bg-background" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">소속 부서</Label>
          <Input id="department" name="department" defaultValue={profile.department || ''} className="rounded-xl bg-background" />
        </div>

        <div className="pt-4">
          <Button type="submit" className="rounded-xl px-8 shadow-sm">
            변경 사항 저장
          </Button>
        </div>
      </form>
    </div>
  );
}
