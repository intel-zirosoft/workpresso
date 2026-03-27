import {
  type ApprovalStepInput,
  type DocumentDetail,
  type DocumentScope,
  type DocumentStatus,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";

export type StatusFilter = "ALL" | DocumentStatus;

export type EditorApprovalStep = ApprovalStepInput & {
  localId: string;
};

export type EditorState = {
  title: string;
  content: string;
  approvalSteps: EditorApprovalStep[];
  ccRecipientIds: string[];
};

const DEFAULT_APPROVAL_STEP_LABELS = ["팀장", "부서장", "대표"];

export const statusLabelMap: Record<DocumentStatus, string> = {
  DRAFT: "초안",
  PENDING: "결재 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const statusBadgeClassMap: Record<DocumentStatus, string> = {
  DRAFT: "bg-secondary/70 text-text",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export const scopeConfig: Array<{
  value: DocumentScope;
  label: string;
  hint: string;
}> = [
  { value: "authored", label: "내 문서 Grid", hint: "내가 작성한 문서" },
  { value: "approvals", label: "내 결재함", hint: "지금 결재할 문서" },
  { value: "cc", label: "공람 문서", hint: "참조로 받은 문서" },
];

export const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "DRAFT", label: "초안" },
  { value: "PENDING", label: "결재 대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

export function createEmptyEditorState(): EditorState {
  return {
    title: "",
    content: "",
    approvalSteps: DEFAULT_APPROVAL_STEP_LABELS.map((stepLabel, index) => ({
      localId: `${stepLabel}-${index}`,
      stepLabel,
      approverId: "",
    })),
    ccRecipientIds: [],
  };
}

export function createEditorStateFromDocument(
  document: DocumentDetail,
): EditorState {
  return {
    title: document.title,
    content: document.content,
    approvalSteps: document.approvalSteps.map((step) => ({
      localId: step.id,
      stepLabel: step.stepLabel,
      approverId: step.approverId,
    })),
    ccRecipientIds: document.ccRecipients.map(
      (recipient) => recipient.recipientId,
    ),
  };
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function renderUserName(user: DocumentUser | null | undefined) {
  if (!user) {
    return "-";
  }

  return user.department ? `${user.name} · ${user.department}` : user.name;
}
