'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 조직 내 모든 팀(부서) 목록을 가져옵니다. (멤버 수 포함)
 */
export async function getAllTeams() {
  const supabase = await createClient();

  // 팀 목록과 각 팀에 속한 멤버 수 조회를 위해 RPC나 집계 쿼리 사용 가능
  // 여기선 간단하게 두 테이블을 조회하여 조합합니다.
  const [{ data: teams, error: tErr }, { data: userCounts, error: uErr }] = await Promise.all([
    supabase.from('teams').select('*').is('deleted_at', null).order('name'),
    supabase.from('users').select('team_id').is('deleted_at', null)
  ]);

  if (tErr) throw new Error(tErr.message);

  // 멤버 수 매핑
  const countMap = (userCounts || []).reduce((acc: any, user: any) => {
    if (user.team_id) {
      acc[user.team_id] = (acc[user.team_id] || 0) + 1;
    }
    return acc;
  }, {});

  return (teams || []).map(team => ({
    ...team,
    member_count: countMap[team.id] || 0
  }));
}

/**
 * 신규 팀(부서)을 생성합니다.
 */
export async function createTeam(name: string, description: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings/organization');
  revalidatePath('/settings/team');
  return data;
}

/**
 * 기존 팀 정보를 수정합니다.
 */
export async function updateTeam(id: string, name: string, description: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings/organization');
  revalidatePath('/settings/team');
  return data;
}

/**
 * 팀을 삭제합니다. (안전하게 Soft Delete 처리)
 */
export async function deleteTeam(id: string) {
  const supabase = await createClient();

  // 1. 팀 삭제 처리 (Soft Delete)
  const { error } = await supabase
    .from('teams')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // 2. 해당 팀에 속한 멤버들의 team_id를 null로 초기화 (데이터 무결성)
  await supabase
    .from('users')
    .update({ team_id: null })
    .eq('team_id', id);

  revalidatePath('/settings/organization');
  revalidatePath('/settings/team');
  return { success: true };
}

/**
 * 기존의 users.department (문자열) 데이터를 기반으로 정식 팀을 생성하고 연동합니다.
 */
export async function syncLegacyDepartments() {
  const supabase = await createClient();

  // 1. team_id가 없는 활성 사용자들 중 department가 있는 목록 조회
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, department')
    .is('team_id', null)
    .not('department', 'is', null)
    .not('department', 'eq', '')
    .is('deleted_at', null);

  if (uErr) throw new Error(uErr.message);
  if (!users || users.length === 0) return { success: true, count: 0 };

  // 2. 고유 부서명 추출
  const uniqueDepts = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  let createdCount = 0;
  let linkedCount = 0;

  for (const deptName of uniqueDepts) {
    if (!deptName) continue;

    // 3. 기존 팀이 있는지 확인 또는 생성
    let { data: team, error: tErr } = await supabase
      .from('teams')
      .select('id')
      .eq('name', deptName)
      .is('deleted_at', null)
      .single();

    if (!team) {
      const { data: newTeam, error: cErr } = await supabase
        .from('teams')
        .insert([{ name: deptName, description: `${deptName} 조직의 공식 그룹입니다.` }])
        .select()
        .single();
      
      if (cErr) {
        console.error(`Failed to create team: ${deptName}`, cErr);
        continue;
      }
      team = newTeam;
      createdCount++;
    }

    // 4. 해당 부서명을 가진 사용자들에게 team_id 할당
    if (team) {
      const { error: updErr } = await supabase
        .from('users')
        .update({ team_id: team.id })
        .eq('department', deptName)
        .is('team_id', null);
      
      if (!updErr) linkedCount++;
    }
  }

  revalidatePath('/settings/organization');
  revalidatePath('/settings/team');
  
  return { 
    success: true, 
    created_count: createdCount, 
    linked_count: linkedCount 
  };
}
