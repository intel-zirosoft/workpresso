import { getUserProfile } from '@/features/settings/services/userAction';
import {
  getExtension,
  getSystemLlmSecretSummary,
  testLLMConnection,
  upsertExtension,
  upsertSystemLlmApiKey,
} from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Activity, Database, Cpu, Globe2, ShieldAlert } from 'lucide-react';
import { normalizeModelId } from '@/lib/ai/models';

export default async function SystemSettingsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN') {
    redirect('/settings/profile');
  }

  const openRouterSecret = await getSystemLlmSecretSummary();
  const hasOpenRouterKey = openRouterSecret.configured;
  let llmConfig = {
    config: {
      provider: 'openrouter',
      chatModel: 'openai/gpt-4o-mini',
      embeddingModel: 'openai/text-embedding-3-small',
      meetingRefineModel: 'google/gemini-flash-1.5',
      sttModel: 'openai/gpt-4o-audio-preview',
    },
    is_active: hasOpenRouterKey,
  };

  try {
    const ext = await getExtension('system_llm');
    if (ext) llmConfig = { config: ext.config as any, is_active: ext.is_active };
  } catch(e) {}

  async function updateLLM(formData: FormData) {
    'use server';
    const apiKey = String(formData.get('apiKey') ?? '').trim();

    if (apiKey) {
      await upsertSystemLlmApiKey(apiKey);
    }

    await upsertExtension('system_llm', {
      provider: 'openrouter',
      chatModel: normalizeModelId(formData.get('chatModel') as string, 'chat'),
      embeddingModel: normalizeModelId(formData.get('embeddingModel') as string, 'embedding'),
      meetingRefineModel: normalizeModelId(formData.get('meetingRefineModel') as string, 'meetingRefine'),
      sttModel: normalizeModelId(formData.get('sttModel') as string, 'stt'),
    }, hasOpenRouterKey || Boolean(apiKey));
    revalidatePath('/settings/system');
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-headings font-bold text-text">시스템 설정 및 관리</h1>
        <p className="text-sm text-text-muted mt-1 font-body">
          워크프레소 코어 인프라와 외부 API 엔진을 제어합니다. <span className="text-destructive font-bold">최고 관리자 전용 권한</span>입니다.
        </p>
      </div>

      {/* System Health Overview (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '데이터베이스', value: '정상', icon: Database, color: 'text-success', bg: 'bg-success/5' },
          { label: 'AI 엔진 상태', value: '활성', icon: Cpu, color: 'text-primary', bg: 'bg-primary/5' },
          { label: '네트워크 응답', value: '12ms', icon: Activity, color: 'text-info', bg: 'bg-info-soft' },
        ].map((item, idx) => (
          <div key={idx} className="bg-surface border border-background p-6 rounded-3xl shadow-soft flex items-center gap-4">
            <div className={`${item.bg} p-3 rounded-2xl`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{item.label}</p>
              <p className="text-lg font-headings font-bold text-text">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Core Configuration Area */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-background pb-4">
          <div className="bg-destructive/10 p-2 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-xl font-headings font-bold text-text">코어 엔진 구성</h2>
        </div>

        <div className="max-w-3xl">
          <APIKeyForm
            title="시스템 AI 모델 (OpenRouter)"
            description="OpenRouter API 키는 암호화되어 서버 DB에 저장됩니다. 새 키를 입력하면 교체되고, 비워두면 기존 키를 유지합니다."
            isActive={Boolean(llmConfig.is_active && hasOpenRouterKey)}
            fields={[
              {
                name: 'apiKey',
                label: 'OpenRouter API Key',
                type: 'password',
                description: openRouterSecret.maskedValue
                  ? `현재 적용 키: ${openRouterSecret.maskedValue}${openRouterSecret.source === 'env' ? ' (환경변수 fallback)' : ' (DB 저장)'}. 새 값을 입력하면 교체됩니다.`
                  : '현재 저장된 API 키가 없습니다. 새 값을 입력하면 암호화되어 저장됩니다.',
                placeholder: 'sk-or-v1-... 형태의 OpenRouter API 키',
                autoComplete: 'new-password',
              },
              { name: 'chatModel', label: '채팅 모델', type: 'text', defaultValue: llmConfig.config?.chatModel || 'openai/gpt-4o-mini' },
              { name: 'embeddingModel', label: '임베딩 모델', type: 'text', defaultValue: llmConfig.config?.embeddingModel || 'openai/text-embedding-3-small' },
              { name: 'meetingRefineModel', label: '회의록 정제 모델', type: 'text', defaultValue: llmConfig.config?.meetingRefineModel || 'google/gemini-flash-1.5' },
              { name: 'sttModel', label: 'STT 모델', type: 'text', defaultValue: llmConfig.config?.sttModel || 'openai/gpt-4o-audio-preview' }
            ]}
            action={updateLLM}
            onTest={testLLMConnection}
          />
        </div>
      </section>

      {/* Infrastructure Note */}
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
        <Globe2 className="w-5 h-5 text-primary mt-1" />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-bold text-primary">안내:</span> 시스템 설정 변경은 전역 인프라에 즉시 반영됩니다. 
          OpenRouter API 키는 서버 DB에 암호화 저장되며, 저장된 키가 없을 때만 환경변수 fallback을 사용합니다.
        </p>
      </div>
    </div>
  );
}
