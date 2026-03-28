import { getUserProfile } from '@/features/settings/services/userAction';
import { getExtension, upsertExtension } from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Link2, Slack, Github, Zap } from 'lucide-react';

export default async function IntegrationsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  // Fetch configs (ignoring errors if not found; we handle them in the form)
  let slackConfig = { config: { webhookUrl: '' }, is_active: false };
  let jiraConfig = { config: { projectKey: '', apiToken: '' }, is_active: false };

  try {
    const s = await getExtension('slack');
    if (s) slackConfig = { config: s.config as any, is_active: s.is_active };
  } catch(e) {}

  try {
    const j = await getExtension('jira');
    if (j) jiraConfig = { config: j.config as any, is_active: j.is_active };
  } catch(e) {}

  async function updateSlack(formData: FormData) {
    'use server';
    const webhookUrl = formData.get('webhookUrl') as string;
    await upsertExtension('slack', { webhookUrl }, !!webhookUrl);
    revalidatePath('/settings/integrations');
  }

  async function updateJira(formData: FormData) {
    'use server';
    const projectKey = formData.get('projectKey') as string;
    const apiToken = formData.get('apiToken') as string;
    await upsertExtension('jira', { projectKey, apiToken }, !!(projectKey && apiToken));
    revalidatePath('/settings/integrations');
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headings font-bold text-text flex items-center gap-3">
          <Link2 className="w-8 h-8 text-primary" /> 외부 도구 연동
        </h1>
        <p className="text-sm text-muted mt-1 font-body">
          조직에서 사용하는 협업 도구들을 연결하여 업무 효율을 극대화합니다.
        </p>
      </div>
      
      {/* Active Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <APIKeyForm
          title="Slack Webhook"
          description="중요 알림을 보낼 채널의 웹훅 정보를 입력하세요."
          isActive={slackConfig.is_active}
          fields={[{ name: 'webhookUrl', label: 'Slack Webhook URL', type: 'password', defaultValue: slackConfig.config?.webhookUrl }]}
          action={updateSlack}
        />

        <APIKeyForm
          title="Jira Issue Tracking"
          description="이슈 자동 생성을 위해 프로젝트 키와 토큰을 설정합니다."
          isActive={jiraConfig.is_active}
          fields={[
            { name: 'projectKey', label: 'Jira Project Key (예: WP)', type: 'text', defaultValue: jiraConfig.config?.projectKey },
            { name: 'apiToken', label: 'Jira API Token / Password', type: 'password', defaultValue: jiraConfig.config?.apiToken }
          ]}
          action={updateJira}
        />
      </div>

      {/* Coming Soon & Guide */}
      <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex flex-col items-center text-center space-y-4">
        <div className="bg-white p-4 rounded-full shadow-soft">
          <Zap className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-headings font-bold text-text">더 많은 연동 기능이 준비 중입니다</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            GitHub, Google Calendar, Notion 등 비즈니스에 핵심적인 도구들을 곧 만나보실 수 있습니다. 
            필요한 새로운 연동 기능이 있다면 관리자에게 제안해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

