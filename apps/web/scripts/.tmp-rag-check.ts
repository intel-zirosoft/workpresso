import path from 'node:path';
import dotenv from 'dotenv';
import { createHash, createDecipheriv } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../.env.local'),
];
for (const candidate of envCandidates) {
  dotenv.config({ path: candidate, override: false });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appSecretKey = process.env.APP_SECRET_ENCRYPTION_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey || !appSecretKey) {
  throw new Error('Required env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / APP_SECRET_ENCRYPTION_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function decryptSecret(payload: string) {
  const [version, ivBase64, authTagBase64, encryptedBase64] = payload.split(':');
  if (version !== 'v1' || !ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error('invalid secret payload');
  }

  const key = createHash('sha256').update(appSecretKey).digest();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

async function main() {
  const { data: ext, error: extError } = await supabase
    .from('workspace_extensions')
    .select('config, is_active')
    .eq('ext_name', 'system_llm')
    .maybeSingle();
  if (extError) throw extError;

  const rawConfig = (ext?.config as Record<string, any> | null) ?? {};
  const embeddingModel =
    typeof rawConfig.embeddingModel === 'string' && rawConfig.embeddingModel.trim()
      ? rawConfig.embeddingModel.trim()
      : process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || 'openai/text-embedding-3-small';

  const { data: secretRow, error: secretError } = await supabase
    .from('workspace_extension_secrets')
    .select('encrypted_value, value_last4, updated_at')
    .eq('ext_name', 'system_llm')
    .eq('secret_name', 'openrouter_api_key')
    .maybeSingle();
  if (secretError) throw secretError;
  if (!secretRow?.encrypted_value) throw new Error('openrouter secret row not found');

  const apiKey = decryptSecret(secretRow.encrypted_value);
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
    },
  });

  const { count, error: countError } = await supabase
    .from('knowledge_vectors')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  const { data: rows, error: rowsError } = await supabase
    .from('knowledge_vectors')
    .select('id, source_type, source_id, metadata, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);
  if (rowsError) throw rowsError;

  const byType = (rows ?? []).reduce<Record<string, number>>((acc, row: any) => {
    acc[row.source_type] = (acc[row.source_type] ?? 0) + 1;
    return acc;
  }, {});

  const target =
    (rows ?? []).find((row: any) => row.source_type === 'DOCUMENTS' && typeof row.metadata?.title === 'string') ??
    (rows ?? []).find((row: any) => typeof row.metadata?.title === 'string') ??
    (rows ?? [])[0];

  if (!target) {
    console.log(JSON.stringify({ ok: false, reason: 'knowledge_vectors is empty', count }, null, 2));
    return;
  }

  const title = typeof target.metadata?.title === 'string' ? target.metadata.title : null;
  const content = typeof target.metadata?.content === 'string' ? target.metadata.content : '';
  const query = (title || content.replace(/\s+/g, ' ').trim().slice(0, 120)).trim();
  if (!query) {
    console.log(JSON.stringify({ ok: false, reason: 'no queryable title/content', target }, null, 2));
    return;
  }

  const embeddingRes = await client.embeddings.create({
    model: embeddingModel,
    input: query,
    encoding_format: 'float',
  });
  const embedding = embeddingRes.data[0]?.embedding;
  if (!embedding) throw new Error('embedding empty');

  const { data: matches, error: matchError } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
  });
  if (matchError) throw matchError;

  const normalizedMatches = (matches ?? []).map((row: any) => ({
    id: row.id,
    source_type: row.source_type,
    source_id: row.source_id,
    similarity: row.similarity,
    title: row.metadata?.title ?? null,
    content_preview:
      typeof row.metadata?.content === 'string'
        ? row.metadata.content.replace(/\s+/g, ' ').slice(0, 100)
        : null,
  }));
  const matchedTarget = normalizedMatches.find(
    (row: any) => row.id === target.id || row.source_id === target.source_id,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        aiConfigActive: ext?.is_active ?? false,
        embeddingModel,
        secretLast4: secretRow.value_last4,
        secretUpdatedAt: secretRow.updated_at,
        totalKnowledgeCount: count,
        sampledCountsByType: byType,
        query,
        target: {
          id: target.id,
          source_type: target.source_type,
          source_id: target.source_id,
          title,
          updated_at: target.updated_at,
        },
        matchCount: normalizedMatches.length,
        matchedTarget,
        topMatches: normalizedMatches,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[rag-check] failed');
  console.error(error);
  process.exit(1);
});
