import { getUserProfile } from "@/features/settings/services/userAction";
import {
  getSystemLlmSecretSummary,
  upsertSystemLlmApiKey,
  getExtension,
  upsertExtension,
  testJiraConnection,
  testSlackConnection,
  testLLMConnection,
  getIntegrationsStatus,
} from "@/features/settings/services/extensionAction";
import { APIKeyForm } from "@/features/settings/components/APIKeyForm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cn } from "@/lib/utils";
import { Activity, Cpu, MessageSquare, Link2, Github, Zap } from "lucide-react";

export default async function IntegrationsPage() {
  const profile = await getUserProfile();

  if (profile.role !== "SUPER_ADMIN" && profile.role !== "ORG_ADMIN") {
    redirect("/settings/profile");
  }

  const [llmSecret, slack, jira, llm, status] = await Promise.all([
    getSystemLlmSecretSummary(),
    getExtension("slack"),
    getExtension("jira"),
    getExtension("system_llm"),
    getIntegrationsStatus(),
  ]);

  const stats = [
    {
      name: "Slack 연동",
      status: status.slack.is_active,
      icon: MessageSquare,
      color: "text-[#4A154B]",
      bg: "bg-[#4A154B]/5",
      updatedAt: 'updated_at' in status.slack ? status.slack.updated_at : null,
    },
    {
      name: "Jira 연동",
      status: status.jira.is_active,
      icon: Activity,
      color: "text-[#0052CC]",
      bg: "bg-[#0052CC]/5",
      updatedAt: 'updated_at' in status.jira ? status.jira.updated_at : null,
    },
    {
      name: "AI 엔진 (OpenRouter)",
      status: status.llm.is_active,
      icon: Cpu,
      color: "text-primary",
      bg: "bg-primary/5",
      updatedAt: 'updated_at' in status.llm ? status.llm.updated_at : null,
    },
  ];

  // 폼에서 사용할 설정 데이터 추출 및 기본값 처리
  const slackConfig = { config: (slack?.config as any) || { webhookUrl: "" }, is_active: slack?.is_active || false };
  const jiraConfig = { 
    config: (jira?.config as any) || { domain: "", email: "", projectKey: "", apiToken: "" }, 
    is_active: jira?.is_active || false 
  };

  async function updateSlack(formData: FormData) {
    "use server";
    const webhookUrl = formData.get("webhookUrl") as string;
    await upsertExtension("slack", { webhookUrl }, !!webhookUrl);
    revalidatePath("/settings/integrations");
  }

  async function updateJira(formData: FormData) {
    "use server";
    const domain = formData.get("domain") as string;
    const email = formData.get("email") as string;
    const projectKey = formData.get("projectKey") as string;
    const apiToken = formData.get("apiToken") as string;

    await upsertExtension(
      "jira",
      { domain, email, projectKey, apiToken },
      !!(domain && email && projectKey && apiToken),
    );
    revalidatePath("/settings/integrations");
  }

  // Client-side testing bridge (Server Actions passed to components)
  async function handleTestJira(config: any) {
    "use server";
    return await testJiraConnection(config);
  }

  async function handleTestSlack(webhookUrl: string) {
    "use server";
    return await testSlackConnection(webhookUrl);
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
          description="AI 회의 브리핑 및 실시간 알림을 수신할 채널을 설정합니다."
          isActive={slackConfig.is_active}
          fields={[
            {
              name: "webhookUrl",
              label: "Slack Webhook URL",
              type: "password",
              defaultValue: slackConfig.config?.webhookUrl,
            },
          ]}
          action={updateSlack}
          onTest={handleTestSlack}
        />

        <APIKeyForm
          title="Jira Cloud Integration"
          description="회의록 액션 아이템을 Jira 티켓으로 자동 생성합니다."
          isActive={jiraConfig.is_active}
          fields={[
            {
              name: "domain",
              label: "Jira Domain (e.g. your-domain.atlassian.net)",
              type: "text",
              defaultValue: jiraConfig.config?.domain,
            },
            {
              name: "email",
              label: "Atlassian Account Email",
              type: "text",
              defaultValue: jiraConfig.config?.email,
            },
            {
              name: "projectKey",
              label: "Default Project Key",
              type: "text",
              defaultValue: jiraConfig.config?.projectKey,
            },
            {
              name: "apiToken",
              label: "Atlassian API Token",
              type: "password",
              defaultValue: jiraConfig.config?.apiToken,
            },
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
            <h3 className="text-xl font-headings font-bold text-text">
              지능형 자동화 라이브러리 확장 중
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed font-body">
              GitHub, Notion, Google Calendar 연동이 곧 추가됩니다. 회의록
              요약이 자동으로 Notion 페이지에 기록되고, 개발 태스크가 GitHub
              Issue로 생성되는 미래를 준비하고 있습니다.
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
