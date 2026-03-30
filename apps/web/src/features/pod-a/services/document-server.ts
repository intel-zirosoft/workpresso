import type { SupabaseClient } from "@supabase/supabase-js";

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
  type DocumentPermissions,
  type DocumentScope,
  type DocumentStatus,
  type DocumentSummary,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";
import {
  removeKnowledgeSource,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";

const documentSelectColumns =
  "id, author_id, title, content, status, submitted_at, final_approved_at, created_at, updated_at, deleted_at";

const approvalStepSelectColumns =
  "id, document_id, step_order, step_label, approver_id, status, acted_at, comment, deleted_at";

const ccRecipientSelectColumns = "id, document_id, recipient_id, deleted_at";

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

  try {
    await syncDocumentKnowledge(detail);
  } catch (syncError) {
    console.error("document knowledge sync failed:", syncError);
  }

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
    try {
      await syncDocumentKnowledge(nextDetail);
    } catch (syncError) {
      console.error("document knowledge sync failed:", syncError);
    }
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
    await syncDocumentKnowledge(nextDetail);
  } catch (syncError) {
    console.error("document knowledge sync failed:", syncError);
  }

  return nextDetail;
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
    await syncDocumentKnowledge(nextDetail);
  } catch (syncError) {
    console.error("document knowledge sync failed:", syncError);
  }

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
