'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserProfile } from './userAction';

export async function getExtension(extName: string) {
  // Determine role based auth
  const profile = await getUserProfile();
  
  if (extName === 'system_llm' && profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }
  
  if ((extName === 'slack' || extName === 'jira') && profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Need at least ORG_ADMIN for ' + extName);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspace_extensions')
    .select('*')
    .eq('ext_name', extName)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
    throw new Error(error.message);
  }
  return data;
}

export async function upsertExtension(extName: string, config: Record<string, any>, isActive: boolean) {
  const profile = await getUserProfile();

  if (extName === 'system_llm' && profile.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Need SUPER_ADMIN for system_llm');
  }

  if ((extName === 'slack' || extName === 'jira') && profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden: Need at least ORG_ADMIN for ' + extName);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('workspace_extensions')
    .upsert({ 
      ext_name: extName, 
      config, 
      is_active: isActive,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'ext_name' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
