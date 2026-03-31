import { describe, expect, it } from "vitest";

import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  buildDocumentDetail,
  createDocumentInputSchema,
  normalizeDocumentRow,
} from "@/features/pod-a/services/document-schema";

describe("document-schema", () => {
  it("trims the title when creating a document", () => {
    const parsed = createDocumentInputSchema.parse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "  분기 운영 계획  ",
      content: "본문",
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000002",
        },
      ],
      ccRecipientIds: [],
    });

    expect(parsed.title).toBe("분기 운영 계획");
  });

  it("rejects duplicate approvers and CC recipients", () => {
    const parsed = createDocumentInputSchema.safeParse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "문서 제목",
      content: "본문",
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000002",
        },
        {
          stepLabel: "부서장",
          approverId: "00000000-0000-4000-8000-000000000002",
        },
      ],
      ccRecipientIds: [
        "00000000-0000-4000-8000-000000000003",
        "00000000-0000-4000-8000-000000000003",
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects content longer than the schema limit", () => {
    const parsed = createDocumentInputSchema.safeParse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "문서 제목",
      content: "a".repeat(DOCUMENT_CONTENT_MAX_LENGTH + 1),
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000002",
        },
      ],
      ccRecipientIds: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("normalizes nullable workflow timestamps into the client contract", () => {
    const document = normalizeDocumentRow({
      id: "00000000-0000-4000-8000-000000000001",
      author_id: "00000000-0000-4000-8000-000000000002",
      title: "운영 계획",
      content: null,
      status: "DRAFT",
      submitted_at: null,
      final_approved_at: null,
      created_at: "2026-03-26T00:00:00.000Z",
      updated_at: "2026-03-26T01:00:00.000Z",
      deleted_at: null,
    });

    expect(document).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      authorId: "00000000-0000-4000-8000-000000000002",
      title: "운영 계획",
      content: "",
      status: "DRAFT",
      submittedAt: null,
      finalApprovedAt: null,
      createdAt: "2026-03-26T00:00:00.000Z",
      updatedAt: "2026-03-26T01:00:00.000Z",
    });
  });

  it("builds detail permissions based on the active approval step", () => {
    const document = buildDocumentDetail({
      document: {
        id: "00000000-0000-4000-8000-000000000001",
        authorId: "00000000-0000-4000-8000-000000000010",
        title: "운영 계획",
        content: "본문",
        status: "PENDING",
        submittedAt: "2026-03-26T02:00:00.000Z",
        finalApprovedAt: null,
        createdAt: "2026-03-26T00:00:00.000Z",
        updatedAt: "2026-03-26T01:00:00.000Z",
      },
      author: {
        id: "00000000-0000-4000-8000-000000000010",
        name: "작성자",
        department: "운영",
      },
      approvalSteps: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          stepOrder: 1,
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000011",
          approver: {
            id: "00000000-0000-4000-8000-000000000011",
            name: "팀장",
            department: "운영",
          },
          status: "PENDING",
          actedAt: null,
          comment: null,
        },
      ],
      ccRecipients: [],
      permissions: {
        canEdit: false,
        canSubmit: false,
        canApprove: true,
        canReject: true,
        canDelete: false,
      },
    });

    expect(document.permissions.canApprove).toBe(true);
    expect(document.currentStepLabel).toBe("팀장");
  });

  it("keeps title validation aligned with the shared schema limit", () => {
    const parsed = createDocumentInputSchema.safeParse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "a".repeat(DOCUMENT_TITLE_MAX_LENGTH + 1),
      content: "",
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000002",
        },
      ],
      ccRecipientIds: [],
    });

    expect(parsed.success).toBe(false);
  });
});
