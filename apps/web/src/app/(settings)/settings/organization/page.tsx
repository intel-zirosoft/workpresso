import { getUserProfile, getAllUsers } from '@/features/settings/services/userAction';
import { getAllTeams, createTeam, updateTeam, deleteTeam, syncLegacyDepartments } from '@/features/settings/services/teamAction';
import { redirect } from 'next/navigation';
import { Building2, Users2, ShieldCheck, Plus, Settings2, Trash2, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { revalidatePath } from 'next/cache';

export default async function OrganizationSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  // Fetch data
  const [teams, allUsers] = await Promise.all([
    getAllTeams(),
    getAllUsers()
  ]);

  // Check for legacy departments (users with department string but no team_id)
  const legacyUsers = allUsers.filter((u: any) => u.department && !u.team_id);
  const legacyDeptCount = new Set(legacyUsers.map((u: any) => u.department)).size;

  // Server Actions
  async function handleCreateTeam(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    await createTeam(name, description);
    revalidatePath('/settings/organization');
  }

  async function handleSyncAction() {
    'use server';
    await syncLegacyDepartments();
    revalidatePath('/settings/organization');
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-12">
      {/* Sync Warning Banner (If legacy data found) */}
      {legacyUsers.length > 0 && (
        <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 shadow-soft">
          <div className="flex gap-4">
            <div className="bg-amber-100 p-3 rounded-2xl h-fit">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-headings font-bold text-amber-900">레거시 데이터 동기화 필요</h3>
              <p className="text-sm text-amber-700/80 mt-1 font-body">
                부서 정보가 텍스트(`department`)로만 남아있는 멤버 <span className="font-bold underline">{legacyUsers.length}명</span>이 감지되었습니다. 
                이들을 위해 정식 팀 <span className="font-bold underline">{legacyDeptCount}개</span>를 자동으로 구성하고 연동할 수 있습니다.
              </p>
            </div>
          </div>
          <form action={handleSyncAction}>
            <Button className="rounded-pill px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-soft whitespace-nowrap gap-2">
              <RefreshCw className="w-4 h-4" /> 지금 동기화하기
            </Button>
          </form>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headings font-bold text-text flex items-center gap-3">
            <Building2 className="w-9 h-9 text-primary" /> 조직 및 부서 관리
          </h1>
          <p className="text-sm text-muted mt-2 font-body max-w-2xl">
            워크프레소의 모든 팀(부서)을 정의하고 관리합니다. 각 부서는 팀원 관리의 기준이 되며, 
            <span className="text-primary font-bold"> 전사적인 조직도 체계</span>를 형성하는 핵심 단위입니다.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-pill px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all active:scale-95 gap-2">
              <Plus className="w-5 h-5" /> 새 팀 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-premium animate-in zoom-in-95 duration-300">
            <form action={handleCreateTeam}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headings font-bold text-text">새로운 팀 생성</DialogTitle>
                <DialogDescription className="font-body text-muted py-2">
                  조직의 새로운 부서나 프로젝트 팀을 정의합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 font-body">
                <div className="space-y-2.5 px-1">
                  <Label htmlFor="name" className="text-sm font-bold text-muted px-2">팀(부서) 이름</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="예: 전략기획실, AI 연구소" 
                    className="rounded-2xl h-12 bg-background/50 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold px-5"
                    required 
                  />
                </div>
                <div className="space-y-2.5 px-1">
                  <Label htmlFor="description" className="text-sm font-bold text-muted px-2">팀 설명</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="팀의 역할과 목적을 간단히 설명해 주세요." 
                    className="rounded-2xl min-h-[120px] bg-background/50 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all px-5 py-4 resize-none text-sm"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full rounded-pill h-12 bg-primary hover:bg-primary/90 font-bold shadow-soft">
                  팀 생성 완료
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-background rounded-[32px] p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-primary/5 p-6 rounded-full inline-block">
              <Building2 className="w-12 h-12 text-primary/30" />
            </div>
            <div>
              <h3 className="text-xl font-headings font-bold text-muted">등록된 팀이 없습니다</h3>
              <p className="text-sm text-muted-foreground mt-2 font-body max-w-xs mx-auto">
                새 팀 생성 버튼을 눌러 조직의 공식 부서를 정의해 보세요.
              </p>
            </div>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="group bg-white border border-background rounded-[32px] p-8 shadow-soft hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/5 text-muted hover:text-primary">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-destructive/5 text-muted hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headings font-bold text-text group-hover:text-primary transition-colors">{team.name}</h3>
                    <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2.5 py-0.5 rounded-full mt-1 w-fit">
                      <span className="text-[10px] font-black uppercase tracking-widest">{team.member_count} Members</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  {team.description || '이 부서에 대한 설명이 등록되지 않았습니다.'}
                </p>

                <div className="pt-4 border-t border-background flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>Active Team</span>
                  </div>
                  <span className="text-background-foreground/30">ID: {team.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Safety Belt */}
      <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <p className="text-[13px] text-muted-foreground leading-relaxed font-body">
          <span className="font-bold text-primary">안내:</span> 팀을 삭제하더라도 소속된 멤버들은 시스템에서 제외되지 않으며, 자동으로 <span className="underline decoration-primary/30">'미지정'</span> 상태로 전환됩니다.
        </p>
      </div>
    </div>
  );
}

