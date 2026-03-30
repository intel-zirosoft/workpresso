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
  sanitizeJiraDomain,
} from "@/features/settings/services/extensionAction";
import { APIKeyForm } from "@/features/settings/components/APIKeyForm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cn } from "@/lib/utils";
import { Activity, Cpu, MessageSquare, Link2, Github, Zap, Clock, Calendar, Bell, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

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
    const domainRaw = (formData.get("domain") as string)?.trim();
    const domain = await sanitizeJiraDomain(domainRaw);
    const email = (formData.get("email") as string)?.trim();
    const projectKey = (formData.get("projectKey") as string)?.trim();
    const apiToken = (formData.get("apiToken") as string)?.trim();

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
          조직에서 사용하는 협업 도구들을 연결하고, AI 자동화 엔진의 가동 상태를 모니터링합니다.
        </p>
      </div>

      {/* 🟢 System Health Dashboard & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-[24px] p-6 border border-background shadow-soft hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                stat.status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {stat.status ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-headings font-bold text-text">{stat.name}</h3>
              <p className="text-[11px] text-muted mt-1 font-body">
                {stat.status ? "연동이 정상적으로 가동 중입니다." : "연동 설정이 필요합니다."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔴 Automation Engine Status (Pod-B Core) */}
      <div className="bg-[#fcfaf6] rounded-[32px] p-8 border border-[#7FA1C3]/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-headings font-bold text-text">지능형 자동화 서비스 엔진</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <ShieldCheck className="w-4 h-4" /> 시스템 보호 가동 중
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "데일리 브리핑", active: status.automation.dailyBriefing, icon: Clock, desc: "오늘의 일정 및 전사 이슈 브리핑" },
            { name: "지라 동기화", active: status.automation.jiraSync, icon: Calendar, desc: "지라 마감일 일정을 캘린더에 동기화" },
            { name: "관심 시간(Focus)", active: status.automation.jiraSync, icon: Zap, desc: "우선순위 기반 자동 집중 시간 블로킹" },
            { name: "회의 리마인더", active: status.slack.is_active, icon: Bell, desc: "회의 시작 전 맥락 기반 슬랙 알림" },
          ].map((service) => (
            <div key={service.name} className="bg-white rounded-[24px] p-5 border border-background shadow-soft group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-background rounded-lg group-hover:bg-primary/5 transition-colors">
                  <service.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <h4 className="text-sm font-bold text-text">{service.name}</h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4 line-clamp-1">{service.desc}</p>
              <div className="flex items-center gap-2">
                {service.active ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className={cn("text-[10px] font-bold", service.active ? "text-green-600" : "text-red-500")}>
                  {service.active ? "READY TO RUN" : "IDLE (CONFIG REQ.)"}
                </span>
              </div>
            </div>
          ))}
        </div>
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
        
        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 mt-4 h-fit">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary p-2 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-sm font-bold text-text">지라 연동 가이드</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-body">
            연동 테스트 성공 후 나타나는 <strong>[사용 가능한 이슈 유형]</strong>을 확인하세요. 
            Jira 프로젝트 설정에 따라 <code>Task</code> 대신 <code>작업</code>이나 <code>Story</code>를 
            사용해야 할 수도 있습니다. 권한 오류(401)가 지속되면 해당 유형을 확인해 주세요.
          </p>
        </div>
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
