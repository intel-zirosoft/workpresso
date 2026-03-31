import { z } from "zod";

export const DOCUMENT_TITLE_MAX_LENGTH = 120;
export const DOCUMENT_CONTENT_MAX_LENGTH = 20000;
export const DOCUMENT_APPROVAL_STEP_LABEL_MAX_LENGTH = 40;
export const DOCUMENT_APPROVAL_COMMENT_MAX_LENGTH = 500;

export const documentStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const approvalStepStatusSchema = z.enum([
  "WAITING",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const documentScopeSchema = z.enum(["authored", "approvals", "cc"]);

export const approvalActionSchema = z.enum(["APPROVE", "REJECT"]);

export const documentUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  department: z.string().nullable(),
});

export const approvalStepInputSchema = z.object({
  stepLabel: z
    .string()
    .trim()
    .min(1, "결재 단계 이름을 입력해 주세요.")
    .max(
      DOCUMENT_APPROVAL_STEP_LABEL_MAX_LENGTH,
      `결재 단계 이름은 ${DOCUMENT_APPROVAL_STEP_LABEL_MAX_LENGTH}자 이하로 입력해 주세요.`,
    ),
  approverId: z.string().uuid("유효한 결재자 ID가 필요합니다."),
});

function validateWorkflowParticipants(
  value: {
    approvalSteps: Array<{ approverId: string }>;
    ccRecipientIds: string[];
  },
  ctx: z.RefinementCtx,
) {
  const approverIds = value.approvalSteps.map((step) => step.approverId);
  const approverIdSet = new Set(approverIds);

  if (approverIds.length !== approverIdSet.size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "결재선에는 같은 사용자를 중복 지정할 수 없습니다.",
      path: ["approvalSteps"],
    });
  }

  const ccRecipientIdSet = new Set(value.ccRecipientIds);

  if (value.ccRecipientIds.length !== ccRecipientIdSet.size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "공람자는 중복 지정할 수 없습니다.",
      path: ["ccRecipientIds"],
    });
  }
}

const sharedDocumentInputFields = {
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(
      DOCUMENT_TITLE_MAX_LENGTH,
      `제목은 ${DOCUMENT_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`,
    ),
  content: z
    .string()
    .max(
      DOCUMENT_CONTENT_MAX_LENGTH,
      `본문은 ${DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}자 이하로 입력해 주세요.`,
    ),
  approvalSteps: z
    .array(approvalStepInputSchema)
    .min(1, "최소 1개 이상의 결재 단계가 필요합니다."),
  ccRecipientIds: z.array(z.string().uuid()).default([]),
};

export const createDocumentInputSchema = z
  .object({
    authorId: z.string().uuid("유효한 작성자 ID가 필요합니다."),
    ...sharedDocumentInputFields,
  })
  .superRefine(validateWorkflowParticipants);

export const updateDocumentInputSchema = z
  .object(sharedDocumentInputFields)
  .superRefine(validateWorkflowParticipants);

export const updateDocumentStatusInputSchema = z.object({
  status: documentStatusSchema,
});

export const approvalActionInputSchema = z.object({
  action: approvalActionSchema,
  comment: z
    .string()
    .trim()
    .max(
      DOCUMENT_APPROVAL_COMMENT_MAX_LENGTH,
      `코멘트는 ${DOCUMENT_APPROVAL_COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`,
    )
    .optional(),
});

const rawUserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  department: z.string().nullable().optional(),
});

const rawDocumentSchema = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable(),
  status: documentStatusSchema,
  submitted_at: z.string().nullable().optional(),
  final_approved_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export const documentBaseSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  status: documentStatusSchema,
  submittedAt: z.string().nullable(),
  finalApprovedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const approvalStepSchema = z.object({
  id: z.string().uuid(),
  stepOrder: z.number().int().positive(),
  stepLabel: z.string(),
  approverId: z.string().uuid(),
  approver: documentUserSchema,
  status: approvalStepStatusSchema,
  actedAt: z.string().nullable(),
  comment: z.string().nullable(),
});

export const ccRecipientSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipient: documentUserSchema,
});

export const documentPermissionsSchema = z.object({
  canEdit: z.boolean(),
  canSubmit: z.boolean(),
  canApprove: z.boolean(),
  canReject: z.boolean(),
  canDelete: z.boolean(),
});

export const documentSummarySchema = documentBaseSchema.extend({
  author: documentUserSchema,
  currentStepLabel: z.string().nullable(),
  currentApprover: documentUserSchema.nullable(),
  approvalStepCount: z.number().int().nonnegative(),
  ccRecipientCount: z.number().int().nonnegative(),
  viewerApprovalStatus: approvalStepStatusSchema.nullable(),
});

export const documentDetailSchema = documentSummarySchema.extend({
  approvalSteps: z.array(approvalStepSchema),
  ccRecipients: z.array(ccRecipientSchema),
  permissions: documentPermissionsSchema,
});

export const documentListResponseSchema = z.object({
  documents: z.array(documentSummarySchema),
});

export const documentResponseSchema = z.object({
  document: documentDetailSchema,
});

export const userListResponseSchema = z.object({
  users: z.array(documentUserSchema),
});

export function normalizeDocumentUserRow(row: unknown) {
  const parsedRow = rawUserRowSchema.parse(row);

  return documentUserSchema.parse({
    id: parsedRow.id,
    name: parsedRow.name,
    department: parsedRow.department ?? null,
  });
}

export function normalizeDocumentRow(row: unknown) {
  const parsedRow = rawDocumentSchema.parse(row);

  return documentBaseSchema.parse({
    id: parsedRow.id,
    authorId: parsedRow.author_id,
    title: parsedRow.title,
    content: parsedRow.content ?? "",
    status: parsedRow.status,
    submittedAt: parsedRow.submitted_at ?? null,
    finalApprovedAt: parsedRow.final_approved_at ?? null,
    createdAt: parsedRow.created_at,
    updatedAt: parsedRow.updated_at,
  });
}

export function buildDocumentSummary(input: {
  document: DocumentBase;
  author: DocumentUser;
  approvalSteps: ApprovalStep[];
  ccRecipients: CcRecipient[];
  viewerApprovalStatus?: ApprovalStepStatus | null;
}) {
  const currentStep =
    input.approvalSteps.find((step) => step.status === "PENDING") ?? null;

  return documentSummarySchema.parse({
    ...input.document,
    author: input.author,
    currentStepLabel: currentStep?.stepLabel ?? null,
    currentApprover: currentStep?.approver ?? null,
    approvalStepCount: input.approvalSteps.length,
    ccRecipientCount: input.ccRecipients.length,
    viewerApprovalStatus: input.viewerApprovalStatus ?? null,
  });
}

export function buildDocumentDetail(input: {
  document: DocumentBase;
  author: DocumentUser;
  approvalSteps: ApprovalStep[];
  ccRecipients: CcRecipient[];
  permissions: DocumentPermissions;
}) {
  const summary = buildDocumentSummary({
    document: input.document,
    author: input.author,
    approvalSteps: input.approvalSteps,
    ccRecipients: input.ccRecipients,
  });

  return documentDetailSchema.parse({
    ...summary,
    approvalSteps: input.approvalSteps,
    ccRecipients: input.ccRecipients,
    permissions: input.permissions,
  });
}

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;
export type ApprovalStepInput = z.infer<typeof approvalStepInputSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionInputSchema>;
export type UpdateDocumentStatusInput = z.infer<
  typeof updateDocumentStatusInputSchema
>;
export type DocumentUser = z.infer<typeof documentUserSchema>;
export type DocumentBase = z.infer<typeof documentBaseSchema>;
export type ApprovalStep = z.infer<typeof approvalStepSchema>;
export type CcRecipient = z.infer<typeof ccRecipientSchema>;
export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type DocumentDetail = z.infer<typeof documentDetailSchema>;
export type DocumentPermissions = z.infer<typeof documentPermissionsSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type ApprovalStepStatus = z.infer<typeof approvalStepStatusSchema>;
export type DocumentScope = z.infer<typeof documentScopeSchema>;
export type ApprovalAction = z.infer<typeof approvalActionSchema>;
