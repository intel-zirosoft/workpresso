import { getUserProfile, updateUserProfile } from '@/features/settings/services/userAction';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { revalidatePath } from 'next/cache';
import { User, Mail, Building2, ShieldCheck, Camera } from 'lucide-react';

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
      {/* Identity Header */}
      <div className="relative mb-12 flex flex-col items-center">
        <div className="relative group mb-4">
          <div className="w-32 h-32 rounded-full bg-primary/5 border-4 border-surface shadow-md flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
            <User className="w-16 h-16 text-primary/40" />
          </div>
          <button className="absolute bottom-1 right-1 bg-surface p-2 rounded-full shadow-md border border-background/50 text-primary hover:bg-primary hover:text-white transition-all duration-200">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-headings font-bold text-text mb-2">{profile.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <UserRoleBadge role={profile.role || 'USER'} />
            <span className="text-sm text-text-muted font-medium">{profile.department || '부서 미지정'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-background pb-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-headings font-bold text-text">개인 정보 설정</h2>
          </div>

          <form action={updateProfile} className="space-y-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-bold text-text-muted px-4">이름 (표시명)</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    name="name"
                    defaultValue={profile.name}
                    required
                    className="rounded-pill bg-background/50 border-transparent hover:border-primary/20 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 h-12 pl-12 transition-all font-body font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="department" className="text-sm font-bold text-text-muted px-4">소속 부서</Label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                  <Input
                    id="department"
                    name="department"
                    defaultValue={profile.department || ''}
                    className="rounded-pill bg-background/50 border-transparent hover:border-primary/20 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 h-12 pl-12 transition-all font-body font-medium"
                    placeholder="부서명을 입력해주세요"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button type="submit" className="rounded-pill px-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all active:scale-95">
                변경 사항 저장
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
