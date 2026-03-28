'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
