import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Github,
  Link2,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { APIKeyForm } from "@/features/settings/components/APIKeyForm";
import { SlackIdentityMappingForm } from "@/features/settings/components/SlackIdentityMappingForm";
import {
  getIntegrationsStatus,
  getExtension,
  sanitizeJiraDomain,
  testJiraConnection,
  testSlackConnection,
  upsertExtension,
} from "@/features/settings/services/extensionAction";
import {
  getSlackIdentityMappings,
  getSlackMemberOptions,
  saveSlackIdentityMappings,
} from "@/features/settings/services/slackIdentityAction";
import {
  getAllUsers,
  getUserProfile,
} from "@/features/settings/services/userAction";
import { cn } from "@/lib/utils";

export default async function IntegrationsPage() {
  const profile = await getUserProfile();

  if (profile.role !== "SUPER_ADMIN" && profile.role !== "ORG_ADMIN") {
    redirect("/settings/profile");
  }

  const [slack, jira, status, users, slackIdentityMappings] =
    await Promise.all([
      getExtension("slack"),
      getExtension("jira"),
      getIntegrationsStatus(),
      getAllUsers(),
      getSlackIdentityMappings(),
    ]);

  const stats = [
    {
      name: "Slack 연동",
      status: status.slack.is_active,
      icon: MessageSquare,
      color: "text-brand-slack",
      bg: "bg-brand-slack-soft",
    },
    {
      name: "Jira 연동",
      status: status.jira.is_active,
      icon: Activity,
      color: "text-brand-jira",
      bg: "bg-brand-jira-soft",
    },
    {
      name: "AI 엔진 (OpenRouter)",
      status: status.llm.is_active,
      icon: Cpu,
      color: "text-primary",
      bg: "bg-primary/5",
    },
  ];

  const slackConfig = {
    config: (slack?.config as any) || { webhookUrl: "", botToken: "" },
    is_active: slack?.is_active || false,
  };
  const jiraConfig = {
    config:
      (jira?.config as any) || {
        domain: "",
        email: "",
        projectKey: "",
        apiToken: "",
      },
    is_active: jira?.is_active || false,
  };

  let slackMembers: Array<{ id: string; label: string }> = [];
  let slackLoadError: string | null = null;

  try {
    slackMembers = await getSlackMemberOptions();
  } catch (error) {
    slackLoadError =
      error instanceof Error
        ? error.message
        : "Slack 사용자 목록을 불러오지 못했습니다.";
  }

  async function updateSlack(formData: FormData) {
    "use server";

    const webhookUrl = formData.get("webhookUrl") as string;
    const botToken = formData.get("botToken") as string;

    await upsertExtension("slack", { webhookUrl, botToken }, !!webhookUrl);
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

  async function handleTestJira(config: any) {
    "use server";
    return await testJiraConnection(config);
  }

  async function handleTestSlack(config: { webhookUrl?: string }) {
    "use server";
    return await testSlackConnection(config.webhookUrl ?? "");
  }

  async function updateSlackIdentityMappings(formData: FormData) {
    "use server";

    const rowIds = new Set(
      Array.from(formData.keys())
        .filter(
          (key) =>
            key.startsWith("mappingUserId:") ||
            key.startsWith("mappingSlackUserId:"),
        )
        .map((key) => key.split(":")[1] ?? ""),
    );

    const entries = Array.from(rowIds).map((rowId) => ({
      userId: String(formData.get(`mappingUserId:${rowId}`) ?? ""),
      slackUserId: String(formData.get(`mappingSlackUserId:${rowId}`) ?? ""),
    }));

    await saveSlackIdentityMappings(entries);
    revalidatePath("/settings/integrations");
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold font-headings text-text">
          <Link2 className="h-8 w-8 text-primary" /> 외부 도구 연동
        </h1>
        <p className="mt-1 text-sm font-body text-text-muted">
          조직에서 사용하는 협업 도구들을 연결하여 업무 효율을 극대화합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-[24px] border border-background bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className={cn("rounded-2xl p-3", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                  stat.status
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600",
                )}
              >
                {stat.status ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold font-headings text-text">
                {stat.name}
              </h3>
              <p className="mt-1 text-[11px] font-body text-muted">
                {stat.status
                  ? "연동이 정상적으로 가동 중입니다."
                  : "연동 설정이 필요합니다."}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border border-[#7FA1C3]/10 bg-[#fcfaf6] p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold font-headings text-text">
              지능형 자동화 서비스 엔진
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">
            <ShieldCheck className="h-4 w-4" /> 시스템 보호 가동 중
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "데일리 브리핑",
              active: status.automation.dailyBriefing,
              icon: Clock,
              desc: "오늘의 일정 및 전사 이슈 브리핑",
            },
            {
              name: "지라 동기화",
              active: status.automation.jiraSync,
              icon: Calendar,
              desc: "지라 마감일 일정을 캘린더에 동기화",
            },
            {
              name: "관심 시간(Focus)",
              active: status.automation.jiraSync,
              icon: Zap,
              desc: "우선순위 기반 자동 집중 시간 블로킹",
            },
            {
              name: "회의 리마인더",
              active: status.slack.is_active,
              icon: Bell,
              desc: "회의 시작 전 맥락 기반 슬랙 알림",
            },
          ].map((service) => (
            <div
              key={service.name}
              className="group rounded-[24px] border border-background bg-white p-5 shadow-soft transition-all hover:border-primary/20"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-background p-2 transition-colors group-hover:bg-primary/5">
                  <service.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <h4 className="text-sm font-bold text-text">{service.name}</h4>
              </div>
              <p className="mb-4 line-clamp-1 text-[11px] text-muted-foreground">
                {service.desc}
              </p>
              <div className="flex items-center gap-2">
                {service.active ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    service.active ? "text-green-600" : "text-red-500",
                  )}
                >
                  {service.active ? "READY TO RUN" : "IDLE (CONFIG REQ.)"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <APIKeyForm
            title="Slack Webhook"
            description="문서 알림 채널과 Slack 멤버 조회용 Bot Token을 함께 설정합니다."
            isActive={slackConfig.is_active}
            fields={[
              {
                name: "webhookUrl",
                label: "Slack Webhook URL",
                type: "password",
                defaultValue: slackConfig.config?.webhookUrl,
              },
              {
                name: "botToken",
                label: "Slack Bot Token",
                type: "password",
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

        <div className="space-y-4">
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

          <div className="h-fit rounded-3xl border border-primary/10 bg-primary/5 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-sm font-bold text-text">지라 연동 가이드</h4>
            </div>
            <p className="text-xs font-body leading-relaxed text-muted-foreground">
              연동 테스트 성공 후 나타나는 <strong>[사용 가능한 이슈 유형]</strong>을
              확인하세요. Jira 프로젝트 설정에 따라 <code>Task</code> 대신
              <code>작업</code>이나 <code>Story</code>를 사용해야 할 수도 있습니다.
              권한 오류(401)가 지속되면 해당 유형을 확인해 주세요.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col items-center gap-6 rounded-3xl border border-primary/10 bg-primary/5 p-8 md:flex-row">
          <div className="rounded-3xl bg-surface p-5 shadow-soft">
            <Zap className="h-10 w-10 animate-pulse text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold font-headings text-text">
              지능형 자동화 라이브러리 확장 중
            </h3>
            <p className="mt-2 max-w-lg text-sm font-body leading-relaxed text-muted-foreground">
              GitHub, Notion, Google Calendar 연동이 곧 추가됩니다. 회의록
              요약이 자동으로 Notion 페이지에 기록되고, 개발 태스크가 GitHub
              Issue로 생성되는 미래를 준비하고 있습니다.
            </p>
          </div>
        </div>

        <div className="group flex cursor-not-allowed flex-col items-center justify-center rounded-3xl border border-background bg-surface p-8 text-center shadow-soft">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background transition-transform group-hover:scale-110">
            <Github className="h-8 w-8 text-text-muted" />
          </div>
          <h4 className="font-bold text-muted-foreground">GitHub 연동</h4>
          <p className="mt-1 text-xs italic text-text-muted">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}
