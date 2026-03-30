import { getUserProfile } from '@/features/settings/services/userAction';
import { getExtension, upsertExtension, testJiraConnection, testSlackConnection } from '@/features/settings/services/extensionAction';
import { APIKeyForm } from '@/features/settings/components/APIKeyForm';
import { SlackIdentityMappingForm } from '@/features/settings/components/SlackIdentityMappingForm';
import { getSlackIdentityMappings, getSlackMemberOptions, saveSlackIdentityMappings } from '@/features/settings/services/slackIdentityAction';
import { getAllUsers } from '@/features/settings/services/userAction';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Link2, Slack, Github, Zap } from 'lucide-react';

export default async function IntegrationsPage() {
  const profile = await getUserProfile();
  
  if (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ORG_ADMIN') {
    redirect('/settings/profile');
  }

  // Fetch configs (ignoring errors if not found; we handle them in the form)
  let slackConfig = { config: { webhookUrl: '', botToken: '' }, is_active: false };
  let jiraConfig = { 
    config: { 
      domain: '', 
      email: '', 
      projectKey: '', 
      apiToken: '' 
    }, 
    is_active: false 
  };

  try {
    const s = await getExtension('slack');
    if (s) slackConfig = { config: s.config as any, is_active: s.is_active };
  } catch(e) {}

  try {
    const j = await getExtension('jira');
    if (j) jiraConfig = { config: j.config as any, is_active: j.is_active };
  } catch(e) {}

  let slackMembers: Array<{ id: string; label: string }> = [];
  let slackLoadError: string | null = null;

  const [users, slackIdentityMappings] = await Promise.all([
    getAllUsers(),
    getSlackIdentityMappings(),
  ]);

  try {
    slackMembers = await getSlackMemberOptions();
  } catch (error) {
    slackLoadError = error instanceof Error ? error.message : 'Slack 사용자 목록을 불러오지 못했습니다.';
  }

  async function updateSlack(formData: FormData) {
    'use server';
    const webhookUrl = formData.get('webhookUrl') as string;
    const botToken = formData.get('botToken') as string;
    await upsertExtension('slack', { webhookUrl, botToken }, !!webhookUrl);
    revalidatePath('/settings/integrations');
  }

  async function updateJira(formData: FormData) {
    'use server';
    const domain = formData.get('domain') as string;
    const email = formData.get('email') as string;
    const projectKey = formData.get('projectKey') as string;
    const apiToken = formData.get('apiToken') as string;
    
    await upsertExtension('jira', { domain, email, projectKey, apiToken }, !!(domain && email && projectKey && apiToken));
    revalidatePath('/settings/integrations');
  }

  // Client-side testing bridge (Server Actions passed to components)
  async function handleTestJira(config: any) {
    'use server';
    return await testJiraConnection(config);
  }

  async function handleTestSlack(config: { webhookUrl?: string }) {
    'use server';
    return await testSlackConnection(config.webhookUrl ?? '');
  }

  async function updateSlackIdentityMappings(formData: FormData) {
    'use server';

    const rowIds = new Set(
      Array.from(formData.keys())
        .filter((key) => key.startsWith('mappingUserId:') || key.startsWith('mappingSlackUserId:'))
        .map((key) => key.split(':')[1] ?? ''),
    );

    const entries = Array.from(rowIds).map((rowId) => ({
      userId: String(formData.get(`mappingUserId:${rowId}`) ?? ''),
      slackUserId: String(formData.get(`mappingSlackUserId:${rowId}`) ?? ''),
    }));

    await saveSlackIdentityMappings(entries);
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
        <div className="space-y-4">
          <APIKeyForm
            title="Slack Webhook"
            description="문서 알림 채널과 Slack 멤버 조회용 Bot Token을 함께 설정합니다."
            isActive={slackConfig.is_active}
            fields={[
              { 
                name: 'webhookUrl', 
                label: 'Slack Webhook URL', 
                type: 'password', 
                defaultValue: slackConfig.config?.webhookUrl 
              },
              {
                name: 'botToken',
                label: 'Slack Bot Token',
                type: 'password',
                defaultValue: slackConfig.config?.botToken,
              },
            ]}
            action={updateSlack}
            onTest={handleTestSlack}
          />

          <SlackIdentityMappingForm
            users={users.map((user: any) => ({
              id: user.id,
              name: user.name,
              department: user.teams?.name || user.department || null,
            }))}
            slackMembers={slackMembers}
            initialMappings={slackIdentityMappings}
            slackLoadError={slackLoadError}
            action={updateSlackIdentityMappings}
          />
        </div>

        <APIKeyForm
          title="Jira Cloud Integration"
          description="회의록 액션 아이템을 Jira 티켓으로 자동 생성합니다."
          isActive={jiraConfig.is_active}
          fields={[
            { 
              name: 'domain', 
              label: 'Jira Domain (e.g. your-domain.atlassian.net)', 
              type: 'text', 
              defaultValue: jiraConfig.config?.domain 
            },
            { 
              name: 'email', 
              label: 'Atlassian Account Email', 
              type: 'text', 
              defaultValue: jiraConfig.config?.email 
            },
            { 
              name: 'projectKey', 
              label: 'Default Project Key', 
              type: 'text', 
              defaultValue: jiraConfig.config?.projectKey 
            },
            { 
              name: 'apiToken', 
              label: 'Atlassian API Token', 
              type: 'password', 
              defaultValue: jiraConfig.config?.apiToken 
            }
          ]}
          action={updateJira}
          onTest={handleTestJira}
        />
      </div>

      {/* GitHub Integration (Coming Soon Card Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-primary/5 rounded-3xl p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-5 rounded-3xl shadow-soft">
            <Zap className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-headings font-bold text-text">지능형 자동화 라이브러리 확장 중</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed font-body">
               GitHub, Notion, Google Calendar 연동이 곧 추가됩니다. 
               회의록 요약이 자동으로 Notion 페이지에 기록되고, 개발 태스크가 GitHub Issue로 생성되는 미래를 준비하고 있습니다.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-background shadow-soft flex flex-col items-center justify-center text-center group cursor-not-allowed">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Github className="w-8 h-8 text-muted" />
          </div>
          <h4 className="font-bold text-muted-foreground">GitHub 연동</h4>
          <p className="text-xs text-muted mt-1 italic">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}
