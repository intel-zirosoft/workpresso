'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthenticated');

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getUserProfile] Error:', error);
    throw new Error(error.message);
  }
  return profile;
}

export async function updateUserProfile(name: string, department?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('users')
    .update({ name, department, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllUsers() {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*, teams(name)')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  return data;
}

export async function updateUserRoleAndTeam(targetUserId: string, role: string, teamId: string | null) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('users')
    .update({ role, team_id: teamId, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
export async function inviteNewMember(email: string, name: string, role: string, team_id?: string, department?: string) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Only admins can invite members');
  }

  const adminClient = createAdminClient();
  
  // 1. Supabase Auth에 사용자 초대
  const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role, team_id } // Metadata
  });

  if (authError) throw new Error(authError.message);

  // 2. public.users 테이블에 프로필 생성
  const { data, error } = await adminClient
    .from('users')
    .upsert({ 
      id: authData.user.id,
      name,
      department: department || '', // 하위 호환성 유지
      team_id: team_id || null,
      role,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/settings/team');
  revalidatePath('/settings/organization');
  return data;
}

export async function adminUpdateUserProfile(targetUserId: string, updates: { name?: string, department?: string, role?: string, team_id?: string | null }) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/settings/team');
  revalidatePath('/settings/organization');
  return data;
}

export async function adminDeleteUser(targetUserId: string) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden');
  }

  const adminClient = createAdminClient();
  
  // 보안을 위해 실제 삭제가 아닌 Soft Delete (deleted_at 설정) 수행
  const { error } = await adminClient
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message);
  
  // Auth에서도 정지(Ban) 처리를 고려할 수 있습니다 (선택 사항)
  // await adminClient.auth.admin.updateUserById(targetUserId, { ban_duration: '87600h' }); // 10 years ban

  revalidatePath('/settings/team');
  revalidatePath('/settings/organization');
  return { success: true };
}
