'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRoleBadge } from '@/features/settings/components/UserRoleBadge';
import { 
  updateUserRoleAndTeam, 
  inviteNewMember, 
  adminUpdateUserProfile, 
  adminDeleteUser 
} from '@/features/settings/services/userAction';
import { useRouter } from 'next/navigation';
import { 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Shield, 
  User as UserIcon,
  RefreshCw,
  Building2,
  Trash2,
  Pencil
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  avatar_url?: string;
}

interface MemberManagementProps {
  users: User[];
  currentUserId: string;
}

export function MemberManagement({ users, currentUserId }: MemberManagementProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // --- Handlers ---
  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const department = formData.get('department') as string;
    const role = formData.get('role') as string;

    try {
      setUpdating('inviting');
      await inviteNewMember(email, name, department, role);
      setIsInviteOpen(false);
      router.refresh();
    } catch (error) {
      alert('초대 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setUpdating(null);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      department: formData.get('department') as string,
      role: formData.get('role') as string,
    };

    try {
      setUpdating(selectedUser.id);
      await adminUpdateUserProfile(selectedUser.id, updates);
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      alert('수정 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setIsDeleting(true);
      await adminDeleteUser(selectedUser.id);
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      alert('삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      await updateUserRoleAndTeam(userId, newRole, null);
      router.refresh();
    } catch (error) {
      alert('권한 변경 실패');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-background pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-headings font-bold text-text tracking-tight">팀원 인벤토리</h2>
          <p className="text-sm text-muted font-body font-medium">조직의 모든 멤버와 글로벌 권한을 제어합니다.</p>
        </div>
        <Button 
          onClick={() => setIsInviteOpen(true)}
          className="rounded-pill px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all gap-2"
        >
          <UserPlus className="w-4 h-4" />
          멤버 초대하기
        </Button>
      </div>

      {/* Member Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map((user) => (
          <Card 
            key={user.id} 
            className={cn(
              "p-5 bg-white border border-background shadow-soft hover:shadow-md transition-all duration-300 rounded-[28px] flex items-center gap-4 group",
              updating === user.id && "opacity-50 pointer-events-none scale-[0.98]"
            )}
          >
            <Avatar className="w-14 h-14 border-4 border-white shadow-sm ring-1 ring-primary/5 group-hover:ring-primary/20 transition-all">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                {user.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-headings font-bold text-text truncate tracking-tight">{user.name}</h4>
                {user.id === currentUserId && (
                  <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold shadow-sm">나</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                  <Mail className="w-3.5 h-3.5 text-primary/40" />
                  <span className="truncate">{user.email || '이메일 정보 없음'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <UserRoleBadge role={user.role} />
                  {user.department && (
                    <span className="text-[11px] text-muted-foreground font-bold px-3 py-0.5 bg-background rounded-full border border-primary/5">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex flex-col items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-primary/5 transition-all">
                    {updating === user.id ? (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lg border-background/50 animate-in slide-in-from-top-1">
                  <DropdownMenuLabel className="text-[11px] font-bold text-muted px-3 py-2 uppercase tracking-widest opacity-50 font-headings">퀵 액션</DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="rounded-xl px-3 py-2.5 text-sm font-bold gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-all"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" /> 정보 수정하기
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1 bg-background" />
                  <DropdownMenuLabel className="text-[11px] font-bold text-muted px-3 py-2 uppercase tracking-widest opacity-50 font-headings">권한 변경</DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="rounded-xl px-3 py-2 text-sm font-medium gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                    onClick={() => handleQuickRoleChange(user.id, 'SUPER_ADMIN')}
                  >
                    <Shield className="w-4 h-4 text-red-500" /> 최고 관리자
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-xl px-3 py-2 text-sm font-medium gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                    onClick={() => handleQuickRoleChange(user.id, 'ORG_ADMIN')}
                  >
                    <Shield className="w-4 h-4 text-blue-500" /> 조직 관리자
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-xl px-3 py-2 text-sm font-medium gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                    onClick={() => handleQuickRoleChange(user.id, 'TEAM_ADMIN')}
                  >
                    <Shield className="w-4 h-4 text-green-500" /> 팀 관리자
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-xl px-3 py-2 text-sm font-medium gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                    onClick={() => handleQuickRoleChange(user.id, 'USER')}
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" /> 일반 사용자
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {/* --- Modals --- */}
      
      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-md p-8 bg-white shadow-2xl border-background/50">
          <DialogHeader className="space-y-3">
            <div className="bg-primary/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-1">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-headings font-bold text-text">새 팀원 초대하기</DialogTitle>
            <DialogDescription className="text-sm font-body font-medium text-muted">
              조직에 합류할 새 멤버의 정보를 입력해 주세요. <br />초대 메일이 즉시 발송됩니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">이메일 주소</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                  <Input id="email" name="email" type="email" required className="rounded-pill bg-background/50 border-transparent h-12 pl-12 focus:bg-white" placeholder="work@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">성명</Label>
                  <Input id="name" name="name" required className="rounded-pill bg-background/50 border-transparent h-12 px-5 focus:bg-white" placeholder="홍길동" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">부서</Label>
                  <Input id="department" name="department" className="rounded-pill bg-background/50 border-transparent h-12 px-5 focus:bg-white" placeholder="기획팀" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">부여할 권한</Label>
                <select id="role" name="role" className="w-full rounded-pill bg-background/50 border-transparent h-12 px-6 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none">
                  <option value="USER">일반 사용자</option>
                  <option value="TEAM_ADMIN">팀 관리자</option>
                  <option value="ORG_ADMIN">조직 관리자</option>
                  <option value="SUPER_ADMIN">최고 관리자</option>
                </select>
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button type="submit" disabled={!!updating} className="rounded-pill w-full h-12 bg-primary font-bold shadow-soft hover:shadow-md transition-all">
                {updating === 'inviting' ? <RefreshCw className="w-5 h-5 animate-spin" /> : '초대장 발송하기'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit/Delete Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-md p-8 bg-white shadow-2xl border-background/50">
          <DialogHeader className="space-y-3">
            <div className="bg-primary/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-1">
              <Pencil className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-headings font-bold text-text">멤버 정보 수정</DialogTitle>
            <DialogDescription className="text-sm font-body font-medium text-muted">
              {selectedUser?.name}님의 조직 프로필과 권한을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">성명</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedUser?.name} required className="rounded-pill bg-background/50 border-transparent h-12 px-5 focus:bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">부서</Label>
                  <Input id="edit-department" name="department" defaultValue={selectedUser?.department} className="rounded-pill bg-background/50 border-transparent h-12 px-5 focus:bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-xs font-bold text-muted px-4 uppercase tracking-wider">부여할 권한</Label>
                <select id="edit-role" name="role" defaultValue={selectedUser?.role} className="w-full rounded-pill bg-background/50 border-transparent h-12 px-6 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all">
                  <option value="USER">일반 사용자</option>
                  <option value="TEAM_ADMIN">팀 관리자</option>
                  <option value="ORG_ADMIN">조직 관리자</option>
                  <option value="SUPER_ADMIN">최고 관리자</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <Button type="submit" disabled={!!updating} className="rounded-pill w-full h-12 bg-primary font-bold shadow-soft hover:shadow-md">
                {updating === selectedUser?.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : '수정 사항 저장'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-pill w-full h-12 text-destructive font-bold hover:bg-destructive/5 transition-all gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                조직에서 제외하기
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {users.length === 0 && (
        <Card className="p-16 text-center bg-white border border-background rounded-[32px] shadow-soft">
          <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-xl font-headings font-bold text-text mb-2">조직에 활성 멤버가 없습니다.</p>
          <p className="text-sm text-muted font-medium max-w-xs mx-auto mb-8">새로운 멤버를 초대하여 워크프레소 협업을 시작하세요.</p>
          <Button onClick={() => setIsInviteOpen(true)} className="rounded-pill px-8" variant="outline">지금 초대하기</Button>
        </Card>
      )}
    </div>
  );
}

