'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

import { getExtension } from './extensionAction';
import { getUserProfile } from './userAction';

export type SlackIdentityMapping = {
  userId: string;
  slackUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type SlackMemberOption = {
  id: string;
  label: string;
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

export async function getSlackMemberOptions(): Promise<SlackMemberOption[]> {
  await ensureAdminRole();

  const slackExtension = await getExtension('slack');
  const botToken =
    typeof slackExtension?.config?.botToken === 'string'
      ? slackExtension.config.botToken.trim()
      : '';

  if (!botToken) {
    return [];
  }

  const response = await fetch('https://slack.com/api/users.list', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        members?: Array<{
          id?: string;
          deleted?: boolean;
          is_bot?: boolean;
          real_name?: string;
          name?: string;
          profile?: {
            display_name?: string;
            real_name?: string;
          };
        }>;
      }
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error
        ? data.error === 'missing_scope'
          ? 'Slack 사용자 목록 조회 실패: users.list 권한이 없습니다. Slack App에 users:read scope를 추가해 주세요.'
          : `Slack 사용자 목록 조회 실패: ${data.error}`
        : 'Slack 사용자 목록을 불러오지 못했습니다.',
    );
  }

  return ((data.members ?? [])
    .filter((member) => member.id && !member.deleted && !member.is_bot)
    .map((member) => {
      const displayName =
        member.profile?.display_name?.trim() ||
        member.real_name?.trim() ||
        member.profile?.real_name?.trim() ||
        member.name?.trim() ||
        member.id;

      return {
        id: member.id as string,
        label: `${displayName} (${member.id})`,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'ko'))) satisfies SlackMemberOption[];
}

export async function saveSlackIdentityMappings(
  entries: Array<{ userId: string; slackUserId: string }>,
) {
  await ensureAdminRole();

  const adminClient = createAdminClient();
  const cleanedEntries = entries.map((entry) => ({
    userId: entry.userId.trim(),
    slackUserId: normalizeSlackUserId(entry.slackUserId),
  }));
  const completedEntries = cleanedEntries.filter(
    (entry) => entry.userId || entry.slackUserId,
  );

  if (
    completedEntries.some(
      (entry) => !entry.userId || !entry.slackUserId,
    )
  ) {
    throw new Error('WorkPresso 사용자와 Slack 사용자를 모두 선택한 행만 저장할 수 있습니다.');
  }

  const userIds = completedEntries.map((entry) => entry.userId);
  const uniqueUserIds = new Set(userIds);
  if (userIds.length !== uniqueUserIds.size) {
    throw new Error('같은 WorkPresso 사용자를 여러 행에 중복 저장할 수 없습니다.');
  }

  const slackUserIds = completedEntries.map((entry) => entry.slackUserId);
  const uniqueSlackUserIds = new Set(slackUserIds);

  if (slackUserIds.length !== uniqueSlackUserIds.size) {
    throw new Error('같은 Slack 사용자 ID를 여러 구성원에게 중복 저장할 수 없습니다.');
  }

  const { data: existingMappings, error: existingMappingsError } = await adminClient
    .from('user_slack_identities')
    .select('user_id');

  if (existingMappingsError) {
    throw new Error(existingMappingsError.message);
  }

  const existingUserIds = (existingMappings ?? []).map((mapping) => mapping.user_id as string);
  const removedUserIds = existingUserIds.filter((userId) => !uniqueUserIds.has(userId));

  if (removedUserIds.length > 0) {
    const { error } = await adminClient
      .from('user_slack_identities')
      .delete()
      .in('user_id', removedUserIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  for (const entry of completedEntries) {
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
