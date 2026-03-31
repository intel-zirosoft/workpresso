import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppBaseUrl } from "@/lib/app-url";
import {
  buildDocumentDetail,
  buildDocumentSummary,
  normalizeDocumentRow,
  normalizeDocumentUserRow,
  type ApprovalAction,
  type ApprovalStep,
  type ApprovalStepInput,
  type ApprovalStepStatus,
  type CcRecipient,
  type DocumentBase,
  type DocumentDetail,
  type DocumentJiraLink,
  type DocumentPermissions,
  type DocumentScope,
  type DocumentStatus,
  type DocumentSummary,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";
import {
  createJiraIssue,
  getJiraProjectMetadata,
  type JiraIssueTypeSummary,
} from "@/features/settings/services/extensionAction";
import {
  removeKnowledgeSource,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";

const documentSelectColumns =
  "id, author_id, title, content, status, submitted_at, final_approved_at, created_at, updated_at, deleted_at";

const approvalStepSelectColumns =
  "id, document_id, step_order, step_label, approver_id, status, acted_at, comment, deleted_at";

const ccRecipientSelectColumns = "id, document_id, recipient_id, deleted_at";

const documentJiraLinkSelectColumns =
  "id, document_id, issue_key, issue_url, issue_type, summary, status, synced_at, deleted_at";

type RawApprovalStepRow = {
  id: string;
  document_id: string;
  step_order: number;
  step_label: string;
  approver_id: string;
  status: ApprovalStepStatus;
  acted_at: string | null;
  comment: string | null;
  deleted_at: string | null;
};

type RawCcRecipientRow = {
  id: string;
  document_id: string;
  recipient_id: string;
  deleted_at: string | null;
};

type DocumentViewerRole = "SUPER_ADMIN" | "ORG_ADMIN" | "TEAM_ADMIN" | "USER";

function isDocumentAdmin(role: DocumentViewerRole) {
  return role === "SUPER_ADMIN" || role === "ORG_ADMIN";
}

type RawWorkspaceExtensionRow = {
  config: Record<string, unknown> | null;
  is_active: boolean;
};

type RawDocumentJiraLinkRow = {
  id: string;
  document_id: string;
  issue_key: string;
  issue_url: string;
  issue_type: string;
  summary: string;
  status: string;
  synced_at: string | null;
  deleted_at: string | null;
};

type DocumentSideEffectJobType = "DOCUMENT_KNOWLEDGE_SYNC";

type DocumentSideEffectJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";

type RawDocumentSideEffectJobRow = {
  id: string;
  document_id: string;
  job_type: DocumentSideEffectJobType;
  status: DocumentSideEffectJobStatus;
  payload: Record<string, unknown> | null;
  attempt_count: number;
};

function buildPermissions(
  document: DocumentBase,
  approvalSteps: ApprovalStep[],
  viewerId: string,
  viewerRole: DocumentViewerRole,
): DocumentPermissions {
  const activeStep =
    approvalSteps.find((step) => step.status === "PENDING") ?? null;
  const isAuthor = document.authorId === viewerId;
  const canEdit =
    isAuthor && (document.status === "DRAFT" || document.status === "REJECTED");
  const canSubmit = canEdit && approvalSteps.length > 0;
  const canApprove = activeStep?.approverId === viewerId;
  const canDelete =
    isAuthor &&
    (document.status !== "APPROVED" || isDocumentAdmin(viewerRole));

  return {
    canEdit,
    canSubmit,
    canApprove,
    canReject: canApprove,
    canDelete,
    canSyncJira: isAuthor && document.status === "APPROVED",
  };
}

async function fetchViewerRole(
  adminSupabase: SupabaseClient,
  viewerId: string,
): Promise<DocumentViewerRole> {
  const { data, error } = await adminSupabase
    .from("users")
    .select("role")
    .eq("id", viewerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("사용자 권한 정보를 불러오지 못했습니다.");
  }

  return ((data?.role as DocumentViewerRole | undefined) ?? "USER");
}

async function fetchUsersByIds(
  adminSupabase: SupabaseClient,
  userIds: string[],
) {
  const uniqueUserIds = Array.from(new Set(userIds));

  if (uniqueUserIds.length === 0) {
    return new Map<string, DocumentUser>();
  }

  const { data, error } = await adminSupabase
    .from("users")
    .select("id, name, department")
    .in("id", uniqueUserIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error("사용자 정보를 불러오지 못했습니다.");
  }

  return new Map(
    (data ?? []).map((row) => {
      const user = normalizeDocumentUserRow(row);

      return [user.id, user] as const;
    }),
  );
}

async function fetchApprovalStepsByDocumentIds(
  adminSupabase: SupabaseClient,
  documentIds: string[],
) {
  if (documentIds.length === 0) {
    return [] satisfies RawApprovalStepRow[];
  }

  const { data, error } = await adminSupabase
    .from("document_approval_steps")
    .select(approvalStepSelectColumns)
    .in("document_id", documentIds)
    .is("deleted_at", null)
    .order("step_order", { ascending: true });

  if (error) {
    throw new Error("결재선 정보를 불러오지 못했습니다.");
  }

  return (data ?? []) as RawApprovalStepRow[];
}

async function fetchCcRecipientsByDocumentIds(
  adminSupabase: SupabaseClient,
  documentIds: string[],
) {
  if (documentIds.length === 0) {
    return [] satisfies RawCcRecipientRow[];
  }

  const { data, error } = await adminSupabase
    .from("document_cc_recipients")
    .select(ccRecipientSelectColumns)
    .in("document_id", documentIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error("공람자 정보를 불러오지 못했습니다.");
  }

  return (data ?? []) as RawCcRecipientRow[];
}

async function fetchDocumentJiraLinksByDocumentIds(
  adminSupabase: SupabaseClient,
  documentIds: string[],
) {
  if (documentIds.length === 0) {
    return [] satisfies RawDocumentJiraLinkRow[];
  }

  const { data, error } = await adminSupabase
    .from("document_jira_links")
    .select(documentJiraLinkSelectColumns)
    .in("document_id", documentIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("문서 Jira 연동 정보를 불러오지 못했습니다.");
  }

  return (data ?? []) as RawDocumentJiraLinkRow[];
}

function resolveJiraSettings(extension: RawWorkspaceExtensionRow | null) {
  const config = extension?.config ?? {};
  const domain =
    (typeof config.domain === "string" ? config.domain.trim() : "") ||
    (process.env.WORKPRESSO_JIRA_DOMAIN?.trim() ?? "");
  const email =
    (typeof config.email === "string" ? config.email.trim() : "") ||
    (process.env.WORKPRESSO_JIRA_EMAIL?.trim() ?? "");
  const projectKey =
    (typeof config.projectKey === "string" ? config.projectKey.trim() : "") ||
    (process.env.WORKPRESSO_JIRA_PROJECT_KEY?.trim() ?? "");
  const apiToken =
    (typeof config.apiToken === "string" ? config.apiToken.trim() : "") ||
    (process.env.WORKPRESSO_JIRA_API_TOKEN?.trim() ?? "");

  if (!domain || !email || !projectKey || !apiToken) {
    return null;
  }

  if (extension && !extension.is_active) {
    return null;
  }

  return {
    domain,
    email,
    projectKey,
    apiToken,
  };
}

async function buildDocumentDetails(
  adminSupabase: SupabaseClient,
  documents: DocumentBase[],
  viewerId: string,
  viewerRole: DocumentViewerRole,
) {
  const documentIds = documents.map((document) => document.id);
  const rawApprovalSteps = await fetchApprovalStepsByDocumentIds(
    adminSupabase,
    documentIds,
  );
  const rawCcRecipients = await fetchCcRecipientsByDocumentIds(
    adminSupabase,
    documentIds,
  );
  const rawJiraLinks = await fetchDocumentJiraLinksByDocumentIds(
    adminSupabase,
    documentIds,
  );

  const userIds = [
    ...documents.map((document) => document.authorId),
    ...rawApprovalSteps.map((step) => step.approver_id),
    ...rawCcRecipients.map((recipient) => recipient.recipient_id),
  ];
  const usersById = await fetchUsersByIds(adminSupabase, userIds);

  return documents.map((document) => {
    const author = usersById.get(document.authorId);

    if (!author) {
      throw new Error("작성자 정보를 찾지 못했습니다.");
    }

    const approvalSteps = rawApprovalSteps
      .filter((step) => step.document_id === document.id)
      .map((step) => {
        const approver = usersById.get(step.approver_id);

        if (!approver) {
          throw new Error("결재자 정보를 찾지 못했습니다.");
        }

        return {
          id: step.id,
          stepOrder: step.step_order,
          stepLabel: step.step_label,
          approverId: step.approver_id,
          approver,
          status: step.status,
          actedAt: step.acted_at,
          comment: step.comment,
        } satisfies ApprovalStep;
      });

    const ccRecipients = rawCcRecipients
      .filter((recipient) => recipient.document_id === document.id)
      .map((recipient) => {
        const user = usersById.get(recipient.recipient_id);

        if (!user) {
          throw new Error("공람자 정보를 찾지 못했습니다.");
        }

        return {
          id: recipient.id,
          recipientId: recipient.recipient_id,
          recipient: user,
        } satisfies CcRecipient;
      });

    const jiraLinks = rawJiraLinks
      .filter((link) => link.document_id === document.id)
      .map((link) => ({
        id: link.id,
        issueKey: link.issue_key,
        issueUrl: link.issue_url,
        issueType: link.issue_type,
        summary: link.summary,
        status: link.status,
        syncedAt: link.synced_at,
      }) satisfies DocumentJiraLink);

    return buildDocumentDetail({
      document,
      author,
      approvalSteps,
      ccRecipients,
      permissions: buildPermissions(
        document,
        approvalSteps,
        viewerId,
        viewerRole,
      ),
      jiraLinks,
    });
  });
}

async function fetchDocumentRowsByIds(
  adminSupabase: SupabaseClient,
  documentIds: string[],
  status?: DocumentStatus,
) {
  const uniqueDocumentIds = Array.from(new Set(documentIds));

  if (uniqueDocumentIds.length === 0) {
    return [] satisfies DocumentBase[];
  }

  let query = adminSupabase
    .from("documents")
    .select(documentSelectColumns)
    .in("id", uniqueDocumentIds)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("문서 목록을 불러오지 못했습니다.");
  }

  return (data ?? []).map(normalizeDocumentRow);
}

async function fetchWorkspaceExtension(
  adminSupabase: SupabaseClient,
  extName: string,
) {
  const { data, error } = await adminSupabase
    .from("workspace_extensions")
    .select("config, is_active")
    .eq("ext_name", extName)
    .maybeSingle();

  if (error) {
    throw new Error(`${extName} 연동 설정을 불러오지 못했습니다.`);
  }

  return (data as RawWorkspaceExtensionRow | null) ?? null;
}

async function enqueueDocumentKnowledgeSyncJob(params: {
  adminSupabase: SupabaseClient;
  documentId: string;
}) {
  const { adminSupabase, documentId } = params;
  const now = new Date().toISOString();
  const { error } = await adminSupabase
    .from("document_side_effect_jobs")
    .upsert(
      {
        document_id: documentId,
        job_type: "DOCUMENT_KNOWLEDGE_SYNC",
        status: "PENDING",
        payload: {},
        attempt_count: 0,
        last_error: null,
        available_at: now,
        locked_at: null,
        completed_at: null,
        updated_at: now,
      },
      { onConflict: "document_id,job_type" },
    );

  if (error) {
    throw new Error("문서 후처리 작업을 큐에 적재하지 못했습니다.");
  }
}

async function processDocumentKnowledgeSyncJob(params: {
  adminSupabase: SupabaseClient;
  documentId: string;
}) {
  const { adminSupabase, documentId } = params;
  const documents = await fetchDocumentRowsByIds(adminSupabase, [documentId]);
  const document = documents[0];

  if (!document || document.status !== "APPROVED") {
    return;
  }

  const viewerRole = await fetchViewerRole(adminSupabase, document.authorId);

  const [detail] = await buildDocumentDetails(
    adminSupabase,
    [document],
    document.authorId,
    viewerRole,
  );

  if (!detail) {
    return;
  }

  await syncDocumentKnowledge(detail);
}

export async function processPendingDocumentSideEffectJobs(params: {
  adminSupabase: SupabaseClient;
  limit?: number;
}) {
  const { adminSupabase, limit = 1 } = params;
  const now = new Date().toISOString();
  const { data, error } = await adminSupabase
    .from("document_side_effect_jobs")
    .select("id, document_id, job_type, status, payload, attempt_count")
    .in("status", ["PENDING", "FAILED"])
    .lte("available_at", now)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("문서 후처리 작업 목록을 불러오지 못했습니다.");
  }

  const jobs = (data ?? []) as RawDocumentSideEffectJobRow[];

  for (const job of jobs) {
    const processingAt = new Date().toISOString();
    const { data: claimedRows, error: claimError } = await adminSupabase
      .from("document_side_effect_jobs")
      .update({
        status: "PROCESSING",
        attempt_count: job.attempt_count + 1,
        locked_at: processingAt,
        last_error: null,
      })
      .eq("id", job.id)
      .in("status", ["PENDING", "FAILED"])
      .select("id");

    if (claimError) {
      throw new Error("문서 후처리 작업을 잠그지 못했습니다.");
    }

    if (!claimedRows || claimedRows.length === 0) {
      continue;
    }

    try {
      if (job.job_type === "DOCUMENT_KNOWLEDGE_SYNC") {
        await processDocumentKnowledgeSyncJob({
          adminSupabase,
          documentId: job.document_id,
        });
      }

      const { error: completeError } = await adminSupabase
        .from("document_side_effect_jobs")
        .update({
          status: "SUCCEEDED",
          completed_at: new Date().toISOString(),
          locked_at: null,
          last_error: null,
        })
        .eq("id", job.id);

      if (completeError) {
        throw new Error("문서 후처리 작업 완료 상태를 기록하지 못했습니다.");
      }
    } catch (jobError) {
      const nextAvailableAt = new Date(Date.now() + 60_000).toISOString();
      const { error: failError } = await adminSupabase
        .from("document_side_effect_jobs")
        .update({
          status: "FAILED",
          locked_at: null,
          available_at: nextAvailableAt,
          last_error:
            jobError instanceof Error
              ? jobError.message
              : "문서 후처리 작업 처리 중 오류가 발생했습니다.",
        })
        .eq("id", job.id);

      if (failError) {
        console.error(
          "document side effect job failure bookkeeping failed:",
          failError,
        );
      }
    }
  }
}

function resolveSlackWebhookUrl(extension: RawWorkspaceExtensionRow | null) {
  const envWebhookUrl = process.env.WORKPRESSO_SLACK_WEBHOOK_URL?.trim() ?? "";
  const config = extension?.config ?? {};
  const configuredWebhookUrl =
    typeof config.webhookUrl === "string" ? config.webhookUrl.trim() : "";
  const webhookUrl = configuredWebhookUrl || envWebhookUrl;

  if (!webhookUrl) {
    return null;
  }

  if (extension) {
    return extension.is_active ? webhookUrl : null;
  }

  return webhookUrl;
}

function resolveSlackBotToken(extension: RawWorkspaceExtensionRow | null) {
  const envBotToken = process.env.WORKPRESSO_SLACK_BOT_TOKEN?.trim() ?? "";
  const config = extension?.config ?? {};
  const configuredBotToken =
    typeof config.botToken === "string" ? config.botToken.trim() : "";
  const botToken = configuredBotToken || envBotToken;

  if (!botToken) {
    return null;
  }

  if (extension) {
    return extension.is_active ? botToken : null;
  }

  return botToken;
}

async function fetchSlackUserIdByUserId(
  adminSupabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await adminSupabase
    .from("user_slack_identities")
    .select("slack_user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Slack 사용자 매핑 정보를 불러오지 못했습니다.");
  }

  const slackUserId =
    typeof data?.slack_user_id === "string" ? data.slack_user_id.trim() : "";

  return slackUserId || null;
}

async function openSlackDirectMessageChannel(params: {
  botToken: string;
  slackUserId: string;
}) {
  const { botToken, slackUserId } = params;
  const response = await fetch("https://slack.com/api/conversations.open", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      users: slackUserId,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        channel?: { id?: string };
      }
    | null;

  if (!response.ok || !data?.ok || !data.channel?.id) {
    throw new Error(
      data?.error
        ? `Slack DM 채널 열기 실패: ${data.error}`
        : "Slack DM 채널을 열지 못했습니다.",
    );
  }

  return data.channel.id;
}

async function postSlackBotMessage(params: {
  botToken: string;
  channel: string;
  text: string;
  blocks: Array<Record<string, unknown>>;
}) {
  const { botToken, channel, text, blocks } = params;
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
      }
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error
        ? `Slack DM 발송 실패: ${data.error}`
        : "Slack DM 발송에 실패했습니다.",
    );
  }
}

async function sendDocumentSlackNotification(params: {
  adminSupabase: SupabaseClient;
  document: DocumentDetail;
  event: "SUBMITTED" | "APPROVED_STEP" | "APPROVED_FINAL" | "REJECTED";
  actor?: DocumentUser | null;
  previousApprover?: DocumentUser | null;
}) {
  const { adminSupabase, document, event, actor, previousApprover } = params;
  const extension = await fetchWorkspaceExtension(adminSupabase, "slack");
  const webhookUrl = resolveSlackWebhookUrl(extension);
  const botToken = resolveSlackBotToken(extension);

  if (!webhookUrl && !botToken) {
    return;
  }

  const documentUrl = `${getAppBaseUrl()}/documents`;

  const eventTextMap = {
    SUBMITTED: {
      title: "Pod A 문서 결재 요청",
      summary: "새 문서가 결재 대기 상태로 제출되었습니다.",
    },
    APPROVED_STEP: {
      title: "Pod A 문서 단계 승인 완료",
      summary: "문서가 승인되어 다음 결재 단계로 이동했습니다.",
    },
    APPROVED_FINAL: {
      title: "Pod A 문서 최종 승인 완료",
      summary: "문서가 최종 승인되었습니다.",
    },
    REJECTED: {
      title: "Pod A 문서 반려",
      summary: "문서가 반려되어 작성자가 다시 수정할 수 있습니다.",
    },
  } as const;

  const copy = eventTextMap[event];
  const canRenderSlackApprovalActions =
    (event === "SUBMITTED" || event === "APPROVED_STEP") &&
    document.currentApprover;
  const fields = [
    {
      type: "mrkdwn",
      text: `*문서명*\n${document.title}`,
    },
    {
      type: "mrkdwn",
      text: `*상태*\n${document.status}`,
    },
    {
      type: "mrkdwn",
      text: `*작성자*\n${document.author.name}`,
    },
  ];

  if (actor) {
    fields.push({
      type: "mrkdwn",
      text: `*처리자*\n${actor.name}`,
    });
  }

  if (document.currentStepLabel && document.currentApprover) {
    fields.push({
      type: "mrkdwn",
      text: `*현재 결재 단계*\n${document.currentStepLabel} · ${document.currentApprover.name}`,
    });
  } else if (event === "REJECTED" && previousApprover) {
    fields.push({
      type: "mrkdwn",
      text: `*반려 단계*\n${previousApprover.name}`,
    });
  }

  const actionElements: Array<Record<string, unknown>> = [
    {
      type: "button",
      text: {
        type: "plain_text",
        text: "문서 보기",
        emoji: true,
      },
      url: documentUrl,
      style: event === "REJECTED" ? "danger" : "primary",
    },
  ];

  if (canRenderSlackApprovalActions && document.currentApprover) {
    const baseValue = {
      documentId: document.id,
      approverId: document.currentApprover.id,
    };

    actionElements.unshift(
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "승인",
          emoji: true,
        },
        style: "primary",
        action_id: "document_approve",
        value: JSON.stringify({
          ...baseValue,
          action: "APPROVE",
        }),
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "반려",
          emoji: true,
        },
        style: "danger",
        action_id: "document_reject",
        value: JSON.stringify({
          ...baseValue,
          action: "REJECT",
        }),
      },
    );
  }

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: copy.title,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: copy.summary,
      },
    },
    {
      type: "section",
      fields,
    },
    {
      type: "actions",
      elements: actionElements,
    },
  ];

  const messagePayload = {
    text: `[Pod A] ${copy.title} - ${document.title}`,
    blocks,
  };
  const shouldTryDirectMessage =
    (event === "SUBMITTED" || event === "APPROVED_STEP") &&
    Boolean(document.currentApprover);

  if (shouldTryDirectMessage && document.currentApprover && botToken) {
    try {
      const slackUserId = await fetchSlackUserIdByUserId(
        adminSupabase,
        document.currentApprover.id,
      );

      if (slackUserId) {
        const channelId = await openSlackDirectMessageChannel({
          botToken,
          slackUserId,
        });

        await postSlackBotMessage({
          botToken,
          channel: channelId,
          text: messagePayload.text,
          blocks: messagePayload.blocks,
        });

        return;
      }
    } catch (error) {
      console.error("document direct Slack notification failed:", error);
    }
  }

  if (!webhookUrl) {
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    throw new Error(
      errorText || "Slack 문서 알림 전송에 실패했습니다.",
    );
  }
}

function cleanJiraSummaryText(text: string) {
  return text
    .replace(/\[(?: |x)\]\s*/gi, "")
    .replace(/[*_`#>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

type JiraDraftKind = "EPIC" | "FEATURE" | "TASK";

type JiraIssueDraft = {
  kind: JiraDraftKind;
  summary: string;
  description: string;
};

function extractJiraIssueDrafts(document: DocumentDetail) {
  const issueDrafts: JiraIssueDraft[] = [];
  const uniqueSummaries = new Set<string>();
  const lines = document.content.split(/\r?\n/);
  let currentHeading = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      continue;
    }

    const checklistMatch = line.match(/^[-*]\s+\[\s?\]\s+(.+)$/);
    if (checklistMatch) {
      const summary = cleanJiraSummaryText(checklistMatch[1]);

      if (summary && !uniqueSummaries.has(summary)) {
        uniqueSummaries.add(summary);
        issueDrafts.push({
          kind: "TASK",
          summary,
          description: `${document.title}\n\n원본 문서 기반 체크리스트 항목입니다.`,
        });
      }

      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    const featureHeading = /(핵심 기능|주요 기능|기능 명세|기능 목록|요구사항)/;

    if (bulletMatch && featureHeading.test(currentHeading)) {
      const summary = cleanJiraSummaryText(bulletMatch[1]);

      if (summary && !uniqueSummaries.has(summary)) {
        uniqueSummaries.add(summary);
        issueDrafts.push({
          kind: "FEATURE",
          summary,
          description: `${document.title}\n\n원본 문서의 "${currentHeading}" 섹션에서 추출된 기능 항목입니다.`,
        });
      }

      continue;
    }

    if (!line.startsWith("|") || !line.endsWith("|")) {
      continue;
    }

    if (/^\|[\s:-]+\|/.test(line)) {
      continue;
    }

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    const firstCell = cleanJiraSummaryText(cells[0] ?? "");

    if (
      !firstCell ||
      ["항목", "품목명", "이름", "제목"].includes(firstCell) ||
      uniqueSummaries.has(firstCell)
    ) {
      continue;
    }

    uniqueSummaries.add(firstCell);
    issueDrafts.push({
      kind: "TASK",
      summary: firstCell,
      description: `${document.title}\n\n원본 문서의 표 항목에서 추출된 작업입니다.`,
    });
  }

  if (issueDrafts.length === 0) {
    issueDrafts.push({
      kind: "TASK",
      summary: cleanJiraSummaryText(document.title) || "문서 기반 작업",
      description: `${document.title}\n\n원본 문서 전체를 기준으로 생성된 기본 작업입니다.`,
    });
  }

  return issueDrafts;
}

function pickJiraIssueType(
  issueTypes: JiraIssueTypeSummary[],
  kind: JiraDraftKind,
): JiraIssueTypeSummary | undefined {
  const findByName = (names: string[]) =>
    issueTypes.find((issueType) => names.includes(issueType.name));

  if (kind === "EPIC") {
    return (
      findByName(["에픽", "Epic"]) ??
      issueTypes.find((issueType) => issueType.hierarchyLevel === 1)
    );
  }

  if (kind === "FEATURE") {
    return (
      findByName(["Feature", "스토리", "Story"]) ??
      issueTypes.find(
        (issueType) =>
          !issueType.subtask &&
          issueType.hierarchyLevel === 0 &&
          !["에픽", "Epic", "작업", "Task"].includes(issueType.name),
      ) ??
      pickJiraIssueType(issueTypes, "TASK")
    );
  }

  return (
    findByName(["작업", "Task"]) ??
    issueTypes.find(
      (issueType) => !issueType.subtask && issueType.hierarchyLevel === 0,
    )
  );
}

async function fetchLatestJiraIssueMap(
  adminSupabase: SupabaseClient,
  issueKeys: string[],
) {
  const extension = await fetchWorkspaceExtension(adminSupabase, "jira");
  const jiraSettings = resolveJiraSettings(extension);

  if (!jiraSettings || issueKeys.length === 0) {
    return new Map<string, { status: string; summary: string; issueType: string; issueUrl: string }>();
  }

  const auth = Buffer.from(
    `${jiraSettings.email}:${jiraSettings.apiToken}`,
  ).toString("base64");
  const params = new URLSearchParams({
    jql: `issueKey in (${issueKeys.map((key) => `"${key}"`).join(",")})`,
    fields: "summary,status,issuetype",
    maxResults: String(issueKeys.length),
  });

  const response = await fetch(
    `https://${jiraSettings.domain}/rest/api/3/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Jira 이슈 상태를 조회하지 못했습니다.");
  }

  const data = (await response.json()) as {
    issues?: Array<{
      key: string;
      fields?: {
        summary?: string;
        status?: { name?: string };
        issuetype?: { name?: string };
      };
    }>;
  };

  return new Map(
    (data.issues ?? []).map((issue) => [
      issue.key,
      {
        status: issue.fields?.status?.name ?? "Unknown",
        summary: issue.fields?.summary ?? issue.key,
        issueType: issue.fields?.issuetype?.name ?? "Task",
        issueUrl: `https://${jiraSettings.domain}/browse/${issue.key}`,
      },
    ]),
  );
}

async function refreshDocumentJiraLinks(params: {
  adminSupabase: SupabaseClient;
  documentId: string;
  jiraLinks: DocumentJiraLink[];
}) {
  const { adminSupabase, documentId, jiraLinks } = params;

  if (jiraLinks.length === 0) {
    return;
  }

  const latestIssueMap = await fetchLatestJiraIssueMap(
    adminSupabase,
    jiraLinks.map((link) => link.issueKey),
  );

  if (latestIssueMap.size === 0) {
    return;
  }

  const now = new Date().toISOString();

  await Promise.all(
    jiraLinks.map(async (link) => {
      const latest = latestIssueMap.get(link.issueKey);

      if (!latest) {
        return;
      }

      if (
        latest.status === link.status &&
        latest.summary === link.summary &&
        latest.issueType === link.issueType &&
        latest.issueUrl === link.issueUrl
      ) {
        return;
      }

      const { error } = await adminSupabase
        .from("document_jira_links")
        .update({
          issue_url: latest.issueUrl,
          issue_type: latest.issueType,
          summary: latest.summary,
          status: latest.status,
          synced_at: now,
        })
        .eq("document_id", documentId)
        .eq("issue_key", link.issueKey)
        .is("deleted_at", null);

      if (error) {
        throw new Error("문서 Jira 상태를 갱신하지 못했습니다.");
      }
    }),
  );
}

export async function listDocumentsForViewer(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  scope: DocumentScope;
  status?: DocumentStatus;
}) {
  const { adminSupabase, viewerId, scope, status } = params;
  const viewerRole = await fetchViewerRole(adminSupabase, viewerId);

  if (scope === "authored") {
    let query = adminSupabase
      .from("documents")
      .select(documentSelectColumns)
      .eq("author_id", viewerId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("문서 목록을 불러오지 못했습니다.");
    }

    const details = await buildDocumentDetails(
      adminSupabase,
      (data ?? []).map(normalizeDocumentRow),
      viewerId,
      viewerRole,
    );

    return details.map((detail) =>
      buildDocumentSummary({
        document: {
          id: detail.id,
          authorId: detail.authorId,
          title: detail.title,
          content: detail.content,
          status: detail.status,
          submittedAt: detail.submittedAt,
          finalApprovedAt: detail.finalApprovedAt,
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        },
        author: detail.author,
        approvalSteps: detail.approvalSteps,
        ccRecipients: detail.ccRecipients,
        viewerApprovalStatus: null,
      }),
    );
  }

  if (scope === "approvals") {
    const { data, error } = await adminSupabase
      .from("document_approval_steps")
      .select("document_id, status")
      .eq("approver_id", viewerId)
      .in("status", ["PENDING", "APPROVED", "REJECTED"])
      .is("deleted_at", null);

    if (error) {
      throw new Error("결재 대기 문서를 불러오지 못했습니다.");
    }

    const viewerApprovalStatusByDocumentId = new Map<string, ApprovalStepStatus>(
      (data ?? []).map((row) => [
        row.document_id as string,
        row.status as ApprovalStepStatus,
      ]),
    );
    const documentIds = Array.from(viewerApprovalStatusByDocumentId.keys());
    const documents = await fetchDocumentRowsByIds(
      adminSupabase,
      documentIds,
      status,
    );
    const details = await buildDocumentDetails(
      adminSupabase,
      documents,
      viewerId,
      viewerRole,
    );

    return details.map((detail) =>
      buildDocumentSummary({
        document: {
          id: detail.id,
          authorId: detail.authorId,
          title: detail.title,
          content: detail.content,
          status: detail.status,
          submittedAt: detail.submittedAt,
          finalApprovedAt: detail.finalApprovedAt,
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        },
        author: detail.author,
        approvalSteps: detail.approvalSteps,
        ccRecipients: detail.ccRecipients,
        viewerApprovalStatus:
          viewerApprovalStatusByDocumentId.get(detail.id) ?? null,
      }),
    );
  }

  const { data, error } = await adminSupabase
    .from("document_cc_recipients")
    .select("document_id")
    .eq("recipient_id", viewerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("공람 문서를 불러오지 못했습니다.");
  }

  const documentIds = (data ?? []).map((row) => row.document_id as string);
  const documents = await fetchDocumentRowsByIds(
    adminSupabase,
    documentIds,
    status,
  );
  const details = await buildDocumentDetails(
    adminSupabase,
    documents,
    viewerId,
    viewerRole,
  );

  return details.map((detail) =>
    buildDocumentSummary({
      document: {
        id: detail.id,
        authorId: detail.authorId,
        title: detail.title,
        content: detail.content,
        status: detail.status,
        submittedAt: detail.submittedAt,
        finalApprovedAt: detail.finalApprovedAt,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      },
      author: detail.author,
      approvalSteps: detail.approvalSteps,
      ccRecipients: detail.ccRecipients,
      viewerApprovalStatus: null,
    }),
  );
}

export async function getDocumentDetailForViewer(params: {
  adminSupabase: SupabaseClient;
  documentId: string;
  viewerId: string;
}) {
  const { adminSupabase, documentId, viewerId } = params;
  const viewerRole = await fetchViewerRole(adminSupabase, viewerId);
  const { data, error } = await adminSupabase
    .from("documents")
    .select(documentSelectColumns)
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("문서 상세를 불러오지 못했습니다.");
  }

  if (!data) {
    return null;
  }

  const [detail] = await buildDocumentDetails(
    adminSupabase,
    [normalizeDocumentRow(data)],
    viewerId,
    viewerRole,
  );

  const hasAccess =
    detail.authorId === viewerId ||
    detail.approvalSteps.some((step) => step.approverId === viewerId) ||
    detail.ccRecipients.some((recipient) => recipient.recipientId === viewerId);

  if (!hasAccess) {
    return null;
  }

  if (detail.jiraLinks.length > 0) {
    try {
      await refreshDocumentJiraLinks({
        adminSupabase,
        documentId,
        jiraLinks: detail.jiraLinks,
      });

      const [refreshedDetail] = await buildDocumentDetails(
        adminSupabase,
        [normalizeDocumentRow(data)],
        viewerId,
        viewerRole,
      );

      return refreshedDetail;
    } catch (jiraRefreshError) {
      console.error("document jira refresh failed:", jiraRefreshError);
    }
  }

  return detail;
}

export async function listDocumentUsers(adminSupabase: SupabaseClient) {
  const { data, error } = await adminSupabase
    .from("users")
    .select("id, name, department")
    .is("deleted_at", null)
    .order("department", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("사용자 목록을 불러오지 못했습니다.");
  }

  return (data ?? []).map(normalizeDocumentUserRow);
}

async function ensureUsersExist(
  adminSupabase: SupabaseClient,
  userIds: string[],
) {
  const usersById = await fetchUsersByIds(adminSupabase, userIds);

  if (usersById.size !== new Set(userIds).size) {
    throw new Error("문서 참여자 중 존재하지 않는 사용자가 있습니다.");
  }
}

async function replaceDocumentWorkflow(params: {
  adminSupabase: SupabaseClient;
  documentId: string;
  approvalSteps: ApprovalStepInput[];
  ccRecipientIds: string[];
}) {
  const { adminSupabase, documentId, approvalSteps, ccRecipientIds } = params;

  const { error: deleteStepsError } = await adminSupabase
    .from("document_approval_steps")
    .delete()
    .eq("document_id", documentId);

  if (deleteStepsError) {
    throw new Error("기존 결재선을 정리하지 못했습니다.");
  }

  const { error: deleteCcError } = await adminSupabase
    .from("document_cc_recipients")
    .delete()
    .eq("document_id", documentId);

  if (deleteCcError) {
    throw new Error("기존 공람자를 정리하지 못했습니다.");
  }

  const { error: insertStepsError } = await adminSupabase
    .from("document_approval_steps")
    .insert(
      approvalSteps.map((step, index) => ({
        document_id: documentId,
        step_order: index + 1,
        step_label: step.stepLabel,
        approver_id: step.approverId,
        status: "WAITING",
        acted_at: null,
        comment: null,
      })),
    );

  if (insertStepsError) {
    throw new Error("결재선을 저장하지 못했습니다.");
  }

  if (ccRecipientIds.length > 0) {
    const { error: insertCcError } = await adminSupabase
      .from("document_cc_recipients")
      .insert(
        ccRecipientIds.map((recipientId) => ({
          document_id: documentId,
          recipient_id: recipientId,
        })),
      );

    if (insertCcError) {
      throw new Error("공람자를 저장하지 못했습니다.");
    }
  }
}

export async function createWorkflowDocument(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  title: string;
  content: string;
  approvalSteps: ApprovalStepInput[];
  ccRecipientIds: string[];
}) {
  const {
    adminSupabase,
    viewerId,
    title,
    content,
    approvalSteps,
    ccRecipientIds,
  } = params;

  await ensureUsersExist(adminSupabase, [
    ...approvalSteps.map((step) => step.approverId),
    ...ccRecipientIds,
  ]);

  const { data, error } = await adminSupabase
    .from("documents")
    .insert({
      author_id: viewerId,
      title,
      content,
      status: "DRAFT",
      submitted_at: null,
      final_approved_at: null,
    })
    .select(documentSelectColumns)
    .single();

  if (error || !data) {
    throw new Error("문서를 생성하지 못했습니다.");
  }

  try {
    await replaceDocumentWorkflow({
      adminSupabase,
      documentId: data.id,
      approvalSteps,
      ccRecipientIds,
    });
  } catch (workflowError) {
    await adminSupabase.from("documents").delete().eq("id", data.id);
    throw workflowError;
  }

  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId: data.id,
    viewerId,
  });

  if (!detail) {
    throw new Error("생성된 문서를 다시 불러오지 못했습니다.");
  }

  await syncDocumentKnowledgeForLifecycle({
    previousDocument: null,
    nextDocument: detail,
  });

  return detail;
}

export async function updateWorkflowDocument(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  documentId: string;
  title: string;
  content: string;
  approvalSteps: ApprovalStepInput[];
  ccRecipientIds: string[];
}) {
  const {
    adminSupabase,
    viewerId,
    documentId,
    title,
    content,
    approvalSteps,
    ccRecipientIds,
  } = params;

  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!detail || detail.authorId !== viewerId) {
    return null;
  }

  if (!detail.permissions.canEdit) {
    throw new Error("현재 상태에서는 문서를 수정할 수 없습니다.");
  }

  await ensureUsersExist(adminSupabase, [
    ...approvalSteps.map((step) => step.approverId),
    ...ccRecipientIds,
  ]);

  const { error } = await adminSupabase
    .from("documents")
    .update({
      title,
      content,
      final_approved_at: null,
    })
    .eq("id", documentId)
    .eq("author_id", viewerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("문서를 수정하지 못했습니다.");
  }

  await replaceDocumentWorkflow({
    adminSupabase,
    documentId,
    approvalSteps,
    ccRecipientIds,
  });

  const nextDetail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (nextDetail) {
    await syncDocumentKnowledgeForLifecycle({
      previousDocument: detail,
      nextDocument: nextDetail,
    });
  }

  return nextDetail;
}

export async function submitWorkflowDocument(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  documentId: string;
}) {
  const { adminSupabase, viewerId, documentId } = params;
  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!detail || detail.authorId !== viewerId) {
    return null;
  }

  if (!detail.permissions.canSubmit) {
    throw new Error("현재 상태에서는 결재 요청을 보낼 수 없습니다.");
  }

  if (detail.approvalSteps.length === 0) {
    throw new Error("결재선이 없는 문서는 제출할 수 없습니다.");
  }

  const now = new Date().toISOString();

  const { error: documentError } = await adminSupabase
    .from("documents")
    .update({
      status: "PENDING",
      submitted_at: now,
      final_approved_at: null,
    })
    .eq("id", documentId)
    .eq("author_id", viewerId)
    .is("deleted_at", null);

  if (documentError) {
    throw new Error("문서를 결재 대기 상태로 변경하지 못했습니다.");
  }

  const { error: resetStepsError } = await adminSupabase
    .from("document_approval_steps")
    .update({
      status: "WAITING",
      acted_at: null,
      comment: null,
    })
    .eq("document_id", documentId)
    .is("deleted_at", null);

  if (resetStepsError) {
    throw new Error("결재 단계를 초기화하지 못했습니다.");
  }

  const firstStep = detail.approvalSteps[0];
  const { error: activateStepError } = await adminSupabase
    .from("document_approval_steps")
    .update({
      status: "PENDING",
    })
    .eq("id", firstStep.id);

  if (activateStepError) {
    throw new Error("첫 결재 단계를 활성화하지 못했습니다.");
  }

  const nextDetail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!nextDetail) {
    throw new Error("제출 후 문서를 다시 불러오지 못했습니다.");
  }

  try {
    await sendDocumentSlackNotification({
      adminSupabase,
      document: nextDetail,
      event: "SUBMITTED",
      actor: nextDetail.author,
    });
  } catch (notificationError) {
    console.error("document submit Slack notification failed:", notificationError);
  }

  await syncDocumentKnowledgeForLifecycle({
    previousDocument: detail,
    nextDocument: nextDetail,
  });

  return nextDetail;
}

export async function syncDocumentToJira(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  documentId: string;
}) {
  const { adminSupabase, viewerId, documentId } = params;
  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!detail || detail.authorId !== viewerId) {
    return null;
  }

  if (!detail.permissions.canSyncJira) {
    throw new Error("승인 완료된 작성 문서만 Jira와 연동할 수 있습니다.");
  }

  if (detail.jiraLinks.length > 0) {
    return detail;
  }

  const projectMetadata = await getJiraProjectMetadata();
  const epicType = pickJiraIssueType(projectMetadata.issueTypes, "EPIC");
  const featureType = pickJiraIssueType(projectMetadata.issueTypes, "FEATURE");
  const taskType = pickJiraIssueType(projectMetadata.issueTypes, "TASK");

  if (!taskType && !featureType && !epicType) {
    throw new Error("사용 가능한 Jira 이슈 타입을 찾지 못했습니다.");
  }

  const issueDrafts = extractJiraIssueDrafts(detail);
  const createdLinks: Array<{
    issueKey: string;
    issueUrl: string;
    issueType: string;
    summary: string;
    status: string;
  }> = [];

  let epicKey: string | null = null;

  if (epicType) {
    const epicResult = await createJiraIssue({
      summary: cleanJiraSummaryText(detail.title) || detail.title,
      description: `WorkPresso 문서 기반 Epic\n\n문서 제목: ${detail.title}`,
      issueTypeId: epicType.id,
    });

    epicKey = epicResult.issueKey;
    createdLinks.push({
      issueKey: epicResult.issueKey,
      issueUrl: epicResult.issueUrl,
      issueType: epicType.name,
      summary: cleanJiraSummaryText(detail.title) || detail.title,
      status: "To Do",
    });
  }

  for (const issueDraft of issueDrafts) {
    const issueType =
      (issueDraft.kind === "FEATURE" ? featureType : taskType) ??
      featureType ??
      taskType ??
      epicType;

    if (!issueType) {
      continue;
    }

    const createIssue = async (parentKey?: string | null) =>
      createJiraIssue({
        summary: issueDraft.summary,
        description: `${issueDraft.description}\n\n원본 문서: ${detail.title}`,
        issueTypeId: issueType.id,
        parentKey: parentKey ?? undefined,
      });

    let createdIssue;

    try {
      createdIssue = await createIssue(epicKey);
    } catch (error) {
      if (!epicKey) {
        throw error;
      }

      createdIssue = await createIssue(null);
    }

    createdLinks.push({
      issueKey: createdIssue.issueKey,
      issueUrl: createdIssue.issueUrl,
      issueType: issueType.name,
      summary: issueDraft.summary,
      status: "To Do",
    });
  }

  if (createdLinks.length === 0) {
    throw new Error("Jira로 생성할 이슈를 만들지 못했습니다.");
  }

  const now = new Date().toISOString();
  const { error } = await adminSupabase.from("document_jira_links").insert(
    createdLinks.map((link) => ({
      document_id: detail.id,
      issue_key: link.issueKey,
      issue_url: link.issueUrl,
      issue_type: link.issueType,
      summary: link.summary,
      status: link.status,
      synced_at: now,
    })),
  );

  if (error) {
    throw new Error("생성된 Jira 링크를 저장하지 못했습니다.");
  }

  const syncedDetail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!syncedDetail) {
    throw new Error("Jira 연동 후 문서를 다시 불러오지 못했습니다.");
  }

  return syncedDetail;
}

export async function syncDocumentKnowledge(document: DocumentDetail) {
  await upsertKnowledgeSource({
    sourceType: "DOCUMENTS",
    sourceId: document.id,
    title: document.title,
    content: document.content,
    metadata: {
      author_id: document.authorId,
      author_name: document.author.name,
      status: document.status,
      submitted_at: document.submittedAt,
      final_approved_at: document.finalApprovedAt,
      approval_steps: document.approvalSteps.map((step) => ({
        id: step.id,
        step_order: step.stepOrder,
        step_label: step.stepLabel,
        approver_id: step.approverId,
        approver_name: step.approver.name,
        status: step.status,
      })),
      cc_recipients: document.ccRecipients.map((recipient) => ({
        id: recipient.recipientId,
        name: recipient.recipient.name,
      })),
    },
  });
}

export async function removeDocumentKnowledge(documentId: string) {
  await removeKnowledgeSource({
    sourceType: "DOCUMENTS",
    sourceId: documentId,
  });
}

export async function syncDocumentKnowledgeForLifecycle(params: {
  previousDocument: Pick<DocumentDetail, "id" | "status"> | null;
  nextDocument: DocumentDetail;
}) {
  const { previousDocument, nextDocument } = params;
  const wasApproved = previousDocument?.status === "APPROVED";
  const isApproved = nextDocument.status === "APPROVED";

  try {
    if (isApproved) {
      await syncDocumentKnowledge(nextDocument);
      return;
    }

    if (wasApproved) {
      await removeDocumentKnowledge(nextDocument.id);
    }
  } catch (syncError) {
    console.error("document knowledge sync failed:", syncError);
  }
}

export async function actOnWorkflowDocument(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  documentId: string;
  action: ApprovalAction;
  comment?: string;
}) {
  const { adminSupabase, viewerId, documentId, action, comment } = params;
  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!detail) {
    return null;
  }

  const activeStep =
    detail.approvalSteps.find((step) => step.status === "PENDING") ?? null;

  if (
    detail.status !== "PENDING" ||
    !activeStep ||
    activeStep.approverId !== viewerId
  ) {
    throw new Error("현재 사용자에게 승인 또는 반려 권한이 없습니다.");
  }

  const now = new Date().toISOString();
  const currentStepPatch = {
    status: action === "APPROVE" ? "APPROVED" : "REJECTED",
    acted_at: now,
    comment: action === "REJECT" ? comment?.trim() || null : null,
  };

  const { error: currentStepError } = await adminSupabase
    .from("document_approval_steps")
    .update(currentStepPatch)
    .eq("id", activeStep.id);

  if (currentStepError) {
    throw new Error("현재 결재 단계를 갱신하지 못했습니다.");
  }

  if (action === "REJECT") {
    const { error: rejectDocumentError } = await adminSupabase
      .from("documents")
      .update({
        status: "REJECTED",
        final_approved_at: null,
      })
      .eq("id", documentId)
      .is("deleted_at", null);

    if (rejectDocumentError) {
      throw new Error("문서를 반려 상태로 변경하지 못했습니다.");
    }
  } else {
    const nextStep =
      detail.approvalSteps.find(
        (step) => step.stepOrder === activeStep.stepOrder + 1,
      ) ?? null;

    if (nextStep) {
      const { error: activateNextStepError } = await adminSupabase
        .from("document_approval_steps")
        .update({
          status: "PENDING",
        })
        .eq("id", nextStep.id);

      if (activateNextStepError) {
        throw new Error("다음 결재 단계를 활성화하지 못했습니다.");
      }
    } else {
      const { error: approveDocumentError } = await adminSupabase
        .from("documents")
        .update({
          status: "APPROVED",
          final_approved_at: now,
        })
        .eq("id", documentId)
        .is("deleted_at", null);

      if (approveDocumentError) {
        throw new Error("문서를 최종 승인 상태로 변경하지 못했습니다.");
      }
    }
  }

  const nextDetail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!nextDetail) {
    throw new Error("승인 처리 후 문서를 다시 불러오지 못했습니다.");
  }

  try {
    await sendDocumentSlackNotification({
      adminSupabase,
      document: nextDetail,
      event:
        action === "REJECT"
          ? "REJECTED"
          : nextDetail.status === "APPROVED"
            ? "APPROVED_FINAL"
            : "APPROVED_STEP",
      actor: activeStep.approver,
      previousApprover: activeStep.approver,
    });
  } catch (notificationError) {
    console.error(
      "document approval Slack notification failed:",
      notificationError,
    );
  }

  if (nextDetail.status === "APPROVED") {
    try {
      await enqueueDocumentKnowledgeSyncJob({
        adminSupabase,
        documentId: nextDetail.id,
      });
    } catch (enqueueError) {
      console.error("document-knowledge-sync enqueue failed:", enqueueError);

      try {
        await syncDocumentKnowledge(nextDetail);
      } catch (syncError) {
        console.error("document-knowledge-sync fallback failed:", syncError);
      }
    }
  }

  await syncDocumentKnowledgeForLifecycle({
    previousDocument: detail,
    nextDocument: nextDetail,
  });

  return nextDetail;
}

export async function deleteWorkflowDocument(params: {
  adminSupabase: SupabaseClient;
  viewerId: string;
  documentId: string;
}) {
  const { adminSupabase, viewerId, documentId } = params;
  const detail = await getDocumentDetailForViewer({
    adminSupabase,
    documentId,
    viewerId,
  });

  if (!detail || detail.authorId !== viewerId) {
    return false;
  }

  if (!detail.permissions.canDelete) {
    throw new Error("현재 상태에서는 문서를 삭제할 수 없습니다.");
  }

  const deletedAt = new Date().toISOString();

  const { error: documentError } = await adminSupabase
    .from("documents")
    .update({
      deleted_at: deletedAt,
    })
    .eq("id", documentId)
    .eq("author_id", viewerId)
    .is("deleted_at", null);

  if (documentError) {
    throw new Error("문서를 삭제하지 못했습니다.");
  }

  const { error: stepError } = await adminSupabase
    .from("document_approval_steps")
    .update({
      deleted_at: deletedAt,
    })
    .eq("document_id", documentId)
    .is("deleted_at", null);

  if (stepError) {
    throw new Error("문서 결재선을 삭제하지 못했습니다.");
  }

  const { error: ccError } = await adminSupabase
    .from("document_cc_recipients")
    .update({
      deleted_at: deletedAt,
    })
    .eq("document_id", documentId)
    .is("deleted_at", null);

  if (ccError) {
    throw new Error("문서 공람 대상을 삭제하지 못했습니다.");
  }

  try {
    await removeKnowledgeSource({
      sourceType: "DOCUMENTS",
      sourceId: documentId,
    });
  } catch (syncError) {
    console.error("document knowledge removal failed:", syncError);
  }

  return true;
}

export function documentDetailToSummary(
  detail: DocumentDetail,
): DocumentSummary {
  return buildDocumentSummary({
    document: {
      id: detail.id,
      authorId: detail.authorId,
      title: detail.title,
      content: detail.content,
      status: detail.status,
      submittedAt: detail.submittedAt,
      finalApprovedAt: detail.finalApprovedAt,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
    },
    author: detail.author,
    approvalSteps: detail.approvalSteps,
    ccRecipients: detail.ccRecipients,
  });
}
