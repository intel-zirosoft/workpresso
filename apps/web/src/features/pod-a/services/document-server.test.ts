import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpsertKnowledgeSource, mockRemoveKnowledgeSource } = vi.hoisted(
  () => ({
    mockUpsertKnowledgeSource: vi.fn(),
    mockRemoveKnowledgeSource: vi.fn(),
  }),
);

vi.mock("@/features/pod-c/services/knowledge-sync", () => ({
  upsertKnowledgeSource: mockUpsertKnowledgeSource,
  removeKnowledgeSource: mockRemoveKnowledgeSource,
}));

import { syncDocumentKnowledgeForLifecycle } from "@/features/pod-a/services/document-server";

function createApprovedDocumentDetail() {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    authorId: "00000000-0000-4000-8000-000000000001",
    author: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "작성자",
      department: "운영",
    },
    title: "운영 정책",
    content: "승인된 문서 본문",
    status: "APPROVED" as const,
    submittedAt: "2026-03-30T09:00:00.000Z",
    finalApprovedAt: "2026-03-30T10:00:00.000Z",
    createdAt: "2026-03-30T08:00:00.000Z",
    updatedAt: "2026-03-30T10:00:00.000Z",
    currentStepLabel: null,
    currentApprover: null,
    approvalStepCount: 1,
    ccRecipientCount: 0,
    viewerApprovalStatus: null,
    approvalSteps: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        stepOrder: 1,
        stepLabel: "대표",
        approverId: "00000000-0000-4000-8000-000000000002",
        approver: {
          id: "00000000-0000-4000-8000-000000000002",
          name: "대표",
          department: "경영",
        },
        status: "APPROVED" as const,
        actedAt: "2026-03-30T10:00:00.000Z",
        comment: null,
      },
    ],
    ccRecipients: [],
    jiraLinks: [],
    permissions: {
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canDelete: false,
      canSyncJira: false,
    },
  };
}

describe("syncDocumentKnowledgeForLifecycle", () => {
  beforeEach(() => {
    mockUpsertKnowledgeSource.mockReset();
    mockRemoveKnowledgeSource.mockReset();
  });

  it("upserts knowledge when the next document is approved", async () => {
    const approvedDocument = createApprovedDocumentDetail();

    await syncDocumentKnowledgeForLifecycle({
      previousDocument: {
        id: approvedDocument.id,
        status: "PENDING",
      },
      nextDocument: approvedDocument,
    });

    expect(mockUpsertKnowledgeSource).toHaveBeenCalledTimes(1);
    expect(mockRemoveKnowledgeSource).not.toHaveBeenCalled();
    expect(mockUpsertKnowledgeSource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "DOCUMENTS",
        sourceId: approvedDocument.id,
        title: approvedDocument.title,
        content: approvedDocument.content,
        metadata: expect.objectContaining({
          status: "APPROVED",
          final_approved_at: approvedDocument.finalApprovedAt,
        }),
      }),
    );
  });

  it("removes knowledge when an approved document is reopened to a non-approved state", async () => {
    const reopenedDocument = {
      ...createApprovedDocumentDetail(),
      status: "DRAFT" as const,
      finalApprovedAt: null,
    };

    await syncDocumentKnowledgeForLifecycle({
      previousDocument: {
        id: reopenedDocument.id,
        status: "APPROVED",
      },
      nextDocument: reopenedDocument,
    });

    expect(mockRemoveKnowledgeSource).toHaveBeenCalledTimes(1);
    expect(mockRemoveKnowledgeSource).toHaveBeenCalledWith({
      sourceType: "DOCUMENTS",
      sourceId: reopenedDocument.id,
    });
    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
  });

  it("does nothing for draft/pending/rejected lifecycle changes without prior approval", async () => {
    const draftDocument = {
      ...createApprovedDocumentDetail(),
      status: "DRAFT" as const,
      finalApprovedAt: null,
    };

    await syncDocumentKnowledgeForLifecycle({
      previousDocument: null,
      nextDocument: draftDocument,
    });

    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
    expect(mockRemoveKnowledgeSource).not.toHaveBeenCalled();
  });
});
