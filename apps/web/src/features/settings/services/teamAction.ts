'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserProfile } from './userAction';

export async function getAllTeams() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');
    
  if (error) throw new Error(error.message);
  return data;
}

export async function createTeam(name: string, description?: string) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Insufficient privileges to create a team');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('teams')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTeam(teamId: string, name: string, description?: string) {
  const profile = await getUserProfile();
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Insufficient privileges to update a team');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('teams')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
