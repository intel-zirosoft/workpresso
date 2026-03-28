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
    .select('*');

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
export async function inviteNewMember(email: string, name: string, department: string, role: string) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Only admins can invite members');
  }

  const adminClient = createAdminClient();
  
  // 1. Supabase Auth에 사용자 초대 (임시 비번 또는 매직링크는 Supabase 설정에 따름)
  const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, department, role } // Metadata
  });

  if (authError) throw new Error(authError.message);

  // 2. public.users 테이블에 프로필 생성 (Auth 트리거가 없는 경우 직접 생성)
  // 대부분의 Supabase 설정에서는 Auth 생성 시 트리거로 public.users에 인서트하도록 되어 있으나, 
  // 여기서는 명시적으로 보장하기 위해 upsert를 고려할 수 있습니다.
  const { data, error } = await adminClient
    .from('users')
    .upsert({ 
      id: authData.user.id,
      name,
      department,
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

export async function adminUpdateUserProfile(targetUserId: string, updates: { name?: string, department?: string, role?: string }) {
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
