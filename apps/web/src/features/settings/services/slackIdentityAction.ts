'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

import { getUserProfile } from './userAction';

export type SlackIdentityMapping = {
  userId: string;
  slackUserId: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeSlackUserId(value: string) {
  return value.trim().toUpperCase();
}

async function ensureAdminRole() {
  const profile = await getUserProfile();

  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    throw new Error('Forbidden');
  }
}

export async function getSlackIdentityMappings(): Promise<SlackIdentityMapping[]> {
  await ensureAdminRole();

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('user_slack_identities')
    .select('user_id, slack_user_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    slackUserId: row.slack_user_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function saveSlackIdentityMappings(
  entries: Array<{ userId: string; slackUserId: string }>,
) {
  await ensureAdminRole();

  const adminClient = createAdminClient();
  const cleanedEntries = entries.map((entry) => ({
    userId: entry.userId,
    slackUserId: normalizeSlackUserId(entry.slackUserId),
  }));

  const nonEmptyEntries = cleanedEntries.filter((entry) => entry.slackUserId);
  const slackUserIds = nonEmptyEntries.map((entry) => entry.slackUserId);
  const uniqueSlackUserIds = new Set(slackUserIds);

  if (slackUserIds.length !== uniqueSlackUserIds.size) {
    throw new Error('같은 Slack 사용자 ID를 여러 구성원에게 중복 저장할 수 없습니다.');
  }

  for (const entry of cleanedEntries) {
    if (!entry.userId) {
      continue;
    }

    if (!entry.slackUserId) {
      const { error } = await adminClient
        .from('user_slack_identities')
        .delete()
        .eq('user_id', entry.userId);

      if (error) {
        throw new Error(error.message);
      }

      continue;
    }

    if (!/^[A-Z0-9]{8,}$/.test(entry.slackUserId)) {
      throw new Error(`유효하지 않은 Slack 사용자 ID 형식입니다: ${entry.slackUserId}`);
    }

    const { error } = await adminClient
      .from('user_slack_identities')
      .upsert(
        {
          user_id: entry.userId,
          slack_user_id: entry.slackUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath('/settings/integrations');
}
