import { getUserProfile } from '@/features/settings/services/userAction';
import { getExtension, upsertExtension } from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function SystemSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN') {
    redirect('/settings/profile');
  }

  let llmConfig = { config: { provider: 'openai', apiKey: '' }, is_active: false };

  try {
    const ext = await getExtension('system_llm');
    if (ext) llmConfig = { config: ext.config as any, is_active: ext.is_active };
  } catch(e) {}

  async function updateLLM(formData: FormData) {
    'use server';
    const provider = formData.get('provider') as string;
    const apiKey = formData.get('apiKey') as string;
    await upsertExtension('system_llm', { provider, apiKey }, !!apiKey);
    revalidatePath('/settings/system');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headings font-bold text-foreground">시스템 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">시스템 코어 엔진 및 인프라 키를 관리합니다. 제한된 권한입니다.</p>
      </div>
      
      <div className="max-w-xl">
        <APIKeyForm
          title="시스템 LLM (Language Model)"
          description="RAG 파이프라인 및 백그라운드 워커에 사용될 전역 LLM 제공자 설정"
          isActive={llmConfig.is_active}
          fields={[
            { name: 'provider', label: 'Provider (예: openai, anthropic)', type: 'text', defaultValue: llmConfig.config?.provider || 'openai' },
            { name: 'apiKey', label: 'API Key', type: 'password', defaultValue: llmConfig.config?.apiKey }
          ]}
          action={updateLLM}
        />
      </div>
    </div>
  );
}
