import { getUserProfile, updateUserProfile } from '@/features/settings/services/userAction';
import { ThemeAppearanceSettings } from '@/features/settings/components/ThemeAppearanceSettings';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { revalidatePath } from 'next/cache';
import { User, Building2, ShieldCheck, Camera } from 'lucide-react';

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
    <div className="animate-in fade-in duration-700">
      <div className="relative mb-12 flex flex-col items-center">
        <div className="group relative mb-4">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary/5 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
            <User className="h-16 w-16 text-primary/40" />
          </div>
          <button className="absolute bottom-1 right-1 rounded-full border border-background/50 bg-surface p-2 text-primary shadow-md transition-all duration-200 hover:bg-primary hover:text-white">
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center">
          <h1 className="mb-2 text-3xl font-headings font-bold text-text">{profile.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <UserRoleBadge role={profile.role || 'USER'} />
            <span className="text-sm font-medium text-text-muted">{profile.department || '부서 미지정'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-background pb-4">
            <div className="rounded-xl bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-headings font-bold text-text">개인 정보 설정</h2>
          </div>

          <form action={updateProfile} className="mx-auto max-w-2xl space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="px-4 text-sm font-bold text-text-muted">이름 (표시명)</Label>
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" />
                  <Input
                    id="name"
                    name="name"
                    defaultValue={profile.name}
                    required
                    className="h-12 rounded-pill border-transparent bg-background/50 pl-12 font-body font-medium transition-all hover:border-primary/20 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="department" className="px-4 text-sm font-bold text-text-muted">소속 부서</Label>
                <div className="group relative">
                  <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" />
                  <Input
                    id="department"
                    name="department"
                    defaultValue={profile.department || ''}
                    className="h-12 rounded-pill border-transparent bg-background/50 pl-12 font-body font-medium transition-all hover:border-primary/20 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                    placeholder="부서명을 입력해주세요"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button type="submit" className="h-12 rounded-pill px-12 font-bold text-primary-foreground shadow-soft transition-all hover:shadow-md active:scale-95">
                변경 사항 저장
              </Button>
            </div>
          </form>
        </section>

        <ThemeAppearanceSettings />
      </div>
    </div>
  );
}
