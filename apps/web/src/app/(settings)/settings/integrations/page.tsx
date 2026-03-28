import { getUserProfile } from '@/features/settings/services/userAction';
import { getExtension, upsertExtension } from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headings font-bold text-foreground">외부 연동</h1>
        <p className="text-sm text-muted-foreground mt-1">Slack, Jira 등 워크스페이스 공통 개발 도구를 연동합니다.</p>
      </div>
      
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        <APIKeyForm
          title="Slack Webhook"
          description="알림 메시지를 보낼 슬랙 채널의 웹훅 URL을 입력하세요."
          isActive={slackConfig.is_active}
          fields={[{ name: 'webhookUrl', label: 'Webhook URL', type: 'password', defaultValue: slackConfig.config?.webhookUrl }]}
          action={updateSlack}
        />

        <APIKeyForm
          title="Jira Integration"
          description="이슈 트래킹을 위한 Jira API 연결 정보를 입력합니다."
          isActive={jiraConfig.is_active}
          fields={[
            { name: 'projectKey', label: 'Project Key', type: 'text', defaultValue: jiraConfig.config?.projectKey },
            { name: 'apiToken', label: 'API Token', type: 'password', defaultValue: jiraConfig.config?.apiToken }
          ]}
          action={updateJira}
        />
      </div>
    </div>
  );
}
