import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockCreateAdminClient,
  mockListDocumentsForViewer,
  mockCreateWorkflowDocument,
  mockGetDocumentDetailForViewer,
  mockUpdateWorkflowDocument,
  mockSubmitWorkflowDocument,
  mockActOnWorkflowDocument,
  mockDeleteWorkflowDocument,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockListDocumentsForViewer: vi.fn(),
  mockCreateWorkflowDocument: vi.fn(),
  mockGetDocumentDetailForViewer: vi.fn(),
  mockUpdateWorkflowDocument: vi.fn(),
  mockSubmitWorkflowDocument: vi.fn(),
  mockActOnWorkflowDocument: vi.fn(),
  mockDeleteWorkflowDocument: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/features/pod-a/services/document-server", () => ({
  listDocumentsForViewer: mockListDocumentsForViewer,
  createWorkflowDocument: mockCreateWorkflowDocument,
  getDocumentDetailForViewer: mockGetDocumentDetailForViewer,
  updateWorkflowDocument: mockUpdateWorkflowDocument,
  submitWorkflowDocument: mockSubmitWorkflowDocument,
  actOnWorkflowDocument: mockActOnWorkflowDocument,
  deleteWorkflowDocument: mockDeleteWorkflowDocument,
}));

import { GET as getDocuments, POST as postDocument } from "@/app/api/documents/route";
import {
  DELETE as deleteDocumentRoute,
  GET as getDocument,
  PATCH as patchDocument,
} from "@/app/api/documents/[id]/route";
import { POST as postSubmitDocument } from "@/app/api/documents/[id]/submit/route";
import { POST as postApprovalAction } from "@/app/api/documents/[id]/approval/route";

const adminClient = { from: vi.fn() };

function createDetailDocument(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    authorId: "00000000-0000-4000-8000-000000000010",
    author: {
      id: "00000000-0000-4000-8000-000000000010",
      name: "작성자",
      department: "운영",
    },
    title: "운영 계획",
    content: "본문",
    status: "DRAFT",
    submittedAt: null,
    finalApprovedAt: null,
    createdAt: "2026-03-26T00:00:00.000Z",
    updatedAt: "2026-03-26T01:00:00.000Z",
    currentStepLabel: null,
    currentApprover: null,
    approvalStepCount: 3,
    ccRecipientCount: 1,
    viewerApprovalStatus: null,
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
        status: "WAITING",
        actedAt: null,
        comment: null,
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        stepOrder: 2,
        stepLabel: "부서장",
        approverId: "00000000-0000-4000-8000-000000000012",
        approver: {
          id: "00000000-0000-4000-8000-000000000012",
          name: "부서장",
          department: "운영",
        },
        status: "WAITING",
        actedAt: null,
        comment: null,
      },
      {
        id: "00000000-0000-4000-8000-000000000103",
        stepOrder: 3,
        stepLabel: "대표",
        approverId: "00000000-0000-4000-8000-000000000013",
        approver: {
          id: "00000000-0000-4000-8000-000000000013",
          name: "대표",
          department: "경영",
        },
        status: "WAITING",
        actedAt: null,
        comment: null,
      },
    ],
    ccRecipients: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        recipientId: "00000000-0000-4000-8000-000000000021",
        recipient: {
          id: "00000000-0000-4000-8000-000000000021",
          name: "인사팀",
          department: "HR",
        },
      },
    ],
    permissions: {
      canEdit: true,
      canSubmit: true,
      canApprove: false,
      canReject: false,
      canDelete: true,
    },
    ...overrides,
  };
}

function createSummaryDocument() {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    authorId: "00000000-0000-4000-8000-000000000010",
    author: {
      id: "00000000-0000-4000-8000-000000000010",
      name: "작성자",
      department: "운영",
    },
    title: "운영 계획",
    content: "본문",
    status: "PENDING",
    submittedAt: "2026-03-26T02:00:00.000Z",
    finalApprovedAt: null,
    createdAt: "2026-03-26T00:00:00.000Z",
    updatedAt: "2026-03-26T01:00:00.000Z",
    currentStepLabel: "팀장",
    currentApprover: {
      id: "00000000-0000-4000-8000-000000000011",
      name: "팀장",
      department: "운영",
    },
    approvalStepCount: 3,
    ccRecipientCount: 1,
    viewerApprovalStatus: "PENDING",
  };
}

describe("Pod A document routes", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockCreateAdminClient.mockReset();
    mockListDocumentsForViewer.mockReset();
    mockCreateWorkflowDocument.mockReset();
    mockGetDocumentDetailForViewer.mockReset();
    mockUpdateWorkflowDocument.mockReset();
    mockSubmitWorkflowDocument.mockReset();
    mockActOnWorkflowDocument.mockReset();
    mockDeleteWorkflowDocument.mockReset();

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });
    mockCreateAdminClient.mockReturnValue(adminClient);
  });

  it("returns a scoped document list for the authenticated viewer", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });
    mockListDocumentsForViewer.mockResolvedValue([createSummaryDocument()]);

    const response = await getDocuments(
      new Request("http://localhost:3000/api/documents?scope=approvals&status=PENDING"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockListDocumentsForViewer).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000010",
      scope: "approvals",
      status: "PENDING",
    });
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].currentStepLabel).toBe("팀장");
  });

  it("creates a draft workflow document for the logged-in author", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });
    mockCreateWorkflowDocument.mockResolvedValue(createDetailDocument());

    const response = await postDocument(
      new Request("http://localhost:3000/api/documents", {
        method: "POST",
        body: JSON.stringify({
          authorId: "00000000-0000-4000-8000-000000000010",
          title: "새 문서",
          content: "본문",
          approvalSteps: [
            {
              stepLabel: "팀장",
              approverId: "00000000-0000-4000-8000-000000000011",
            },
            {
              stepLabel: "부서장",
              approverId: "00000000-0000-4000-8000-000000000012",
            },
            {
              stepLabel: "대표",
              approverId: "00000000-0000-4000-8000-000000000013",
            },
          ],
          ccRecipientIds: ["00000000-0000-4000-8000-000000000021"],
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000010",
      title: "새 문서",
      content: "본문",
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000011",
        },
        {
          stepLabel: "부서장",
          approverId: "00000000-0000-4000-8000-000000000012",
        },
        {
          stepLabel: "대표",
          approverId: "00000000-0000-4000-8000-000000000013",
        },
      ],
      ccRecipientIds: ["00000000-0000-4000-8000-000000000021"],
    });
    expect(body.document.approvalSteps).toHaveLength(3);
  });

  it("returns detail only when the viewer has access", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000011",
        },
      },
      error: null,
    });
    mockGetDocumentDetailForViewer.mockResolvedValue(
      createDetailDocument({
        status: "PENDING",
        currentStepLabel: "팀장",
        currentApprover: {
          id: "00000000-0000-4000-8000-000000000011",
          name: "팀장",
          department: "운영",
        },
        permissions: {
          canEdit: false,
          canSubmit: false,
          canApprove: true,
          canReject: true,
          canDelete: false,
        },
      }),
    );

    const response = await getDocument(
      new Request("http://localhost:3000/api/documents/0001"),
      { params: { id: "0001" } },
    );

    expect(response.status).toBe(200);
    expect(mockGetDocumentDetailForViewer).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      documentId: "0001",
      viewerId: "00000000-0000-4000-8000-000000000011",
    });
  });

  it("updates only editable workflow documents", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });
    mockUpdateWorkflowDocument.mockResolvedValue(
      createDetailDocument({
        title: "수정 후 제목",
      }),
    );

    const response = await patchDocument(
      new Request("http://localhost:3000/api/documents/0001", {
        method: "PATCH",
        body: JSON.stringify({
          title: "수정 후 제목",
          content: "수정 후 본문",
          approvalSteps: [
            {
              stepLabel: "팀장",
              approverId: "00000000-0000-4000-8000-000000000011",
            },
          ],
          ccRecipientIds: [],
        }),
      }),
      { params: { id: "0001" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000010",
      documentId: "0001",
      title: "수정 후 제목",
      content: "수정 후 본문",
      approvalSteps: [
        {
          stepLabel: "팀장",
          approverId: "00000000-0000-4000-8000-000000000011",
        },
      ],
      ccRecipientIds: [],
    });
    expect(body.document.title).toBe("수정 후 제목");
  });

  it("submits a draft document to the workflow submit endpoint", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });
    mockSubmitWorkflowDocument.mockResolvedValue(
      createDetailDocument({
        status: "PENDING",
        submittedAt: "2026-03-26T02:00:00.000Z",
        currentStepLabel: "팀장",
        currentApprover: {
          id: "00000000-0000-4000-8000-000000000011",
          name: "팀장",
          department: "운영",
        },
      }),
    );

    const response = await postSubmitDocument(
      new Request("http://localhost:3000/api/documents/0001/submit", {
        method: "POST",
      }),
      { params: { id: "0001" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockSubmitWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000010",
      documentId: "0001",
    });
    expect(body.document.status).toBe("PENDING");
  });

  it("routes approval actions through the workflow approval endpoint", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000011",
        },
      },
      error: null,
    });
    mockActOnWorkflowDocument.mockResolvedValue(
      createDetailDocument({
        status: "APPROVED",
        currentStepLabel: null,
        currentApprover: null,
        finalApprovedAt: "2026-03-26T03:00:00.000Z",
        permissions: {
          canEdit: false,
          canSubmit: false,
          canApprove: false,
          canReject: false,
          canDelete: false,
        },
      }),
    );

    const response = await postApprovalAction(
      new Request("http://localhost:3000/api/documents/0001/approval", {
        method: "POST",
        body: JSON.stringify({
          action: "APPROVE",
        }),
      }),
      { params: { id: "0001" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockActOnWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000011",
      documentId: "0001",
      action: "APPROVE",
      comment: undefined,
    });
    expect(body.document.status).toBe("APPROVED");
  });

  it("routes document deletion through the workflow delete endpoint", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });
    mockDeleteWorkflowDocument.mockResolvedValue(true);

    const response = await deleteDocumentRoute(
      new Request("http://localhost:3000/api/documents/0001", {
        method: "DELETE",
      }),
      { params: { id: "0001" } },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000010",
      documentId: "0001",
    });
  });
});
