import { getUserProfile } from '@/features/settings/services/userAction';
import { getExtension, upsertExtension } from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Activity, Database, Cpu, Globe2, ShieldAlert } from 'lucide-react';

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
    <div className="animate-in fade-in duration-700 space-y-12">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-headings font-bold text-text">시스템 설정 및 관리</h1>
        <p className="text-sm text-muted mt-1 font-body">
          워크프레소 코어 인프라와 외부 API 엔진을 제어합니다. <span className="text-destructive font-bold">최고 관리자 전용 권한</span>입니다.
        </p>
      </div>

      {/* System Health Overview (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '데이터베이스', value: '정상', icon: Database, color: 'text-success', bg: 'bg-success/5' },
          { label: 'AI 엔진 상태', value: '활성', icon: Cpu, color: 'text-primary', bg: 'bg-primary/5' },
          { label: '네트워크 응답', value: '12ms', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/5' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-background p-6 rounded-3xl shadow-soft flex items-center gap-4">
            <div className={`${item.bg} p-3 rounded-2xl`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{item.label}</p>
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
            title="시스템 LLM (Language Model)"
            description="전역 RAG 파이프라인 및 백그라운드 AI 워커에 사용될 핵심 지능 엔진을 설정합니다."
            isActive={llmConfig.is_active}
            fields={[
              { name: 'provider', label: 'AI Provider (OpenAI, Anthropic 등)', type: 'text', defaultValue: llmConfig.config?.provider || 'openai' },
              { name: 'apiKey', label: '시스템 관리자 API Key', type: 'password', defaultValue: llmConfig.config?.apiKey }
            ]}
            action={updateLLM}
          />
        </div>
      </section>

      {/* Infrastructure Note */}
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
        <Globe2 className="w-5 h-5 text-primary mt-1" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-primary">안내:</span> 시스템 설정 변경은 전역 인프라에 즉시 반영됩니다. 
          API 키 변경 시 기존에 진행 중인 AI 작업에 일시적인 지연이 발생할 수 있으니 주의해 주세요.
        </p>
      </div>
    </div>
  );
}

