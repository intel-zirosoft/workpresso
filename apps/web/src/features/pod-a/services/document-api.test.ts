import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  actOnDocument,
  createDocument,
  DocumentApiError,
  fetchDocuments,
  submitDocument,
  syncDocumentToJira,
} from "@/features/pod-a/services/document-api";

const mockFetch = vi.fn();

describe("document-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("requests a scoped document list with no-store caching", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              authorId: "00000000-0000-4000-8000-000000000002",
              author: {
                id: "00000000-0000-4000-8000-000000000002",
                name: "작성자",
                department: "운영",
              },
              title: "결재 대기 문서",
              content: "본문",
              status: "PENDING",
              submittedAt: "2026-03-26T00:30:00.000Z",
              finalApprovedAt: null,
              createdAt: "2026-03-26T00:00:00.000Z",
              updatedAt: "2026-03-26T01:00:00.000Z",
              currentStepLabel: "팀장",
              currentApprover: {
                id: "00000000-0000-4000-8000-000000000003",
                name: "팀장",
                department: "운영",
              },
              approvalStepCount: 3,
              ccRecipientCount: 1,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const documents = await fetchDocuments({
      scope: "approvals",
      status: "PENDING",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents?scope=approvals&status=PENDING",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    expect(documents).toHaveLength(1);
    expect(documents[0]?.currentStepLabel).toBe("팀장");
  });

  it("throws a domain error when the API responds with a failure message", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "문서 목록을 불러오지 못했습니다." }),
        { status: 500 },
      ),
    );

    await expect(fetchDocuments()).rejects.toEqual(
      expect.objectContaining<DocumentApiError>({
        name: "DocumentApiError",
        message: "문서 목록을 불러오지 못했습니다.",
      }),
    );
  });

  it("validates create payloads before sending the request", async () => {
    await expect(
      createDocument({
        authorId: "00000000-0000-4000-8000-000000000001",
        title: "   ",
        content: "본문",
        approvalSteps: [
          {
            stepLabel: "팀장",
            approverId: "00000000-0000-4000-8000-000000000002",
          },
        ],
        ccRecipientIds: [],
      }),
    ).rejects.toBeInstanceOf(ZodError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends submit requests to the dedicated submit endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          document: {
            id: "00000000-0000-4000-8000-000000000001",
            authorId: "00000000-0000-4000-8000-000000000002",
            author: {
              id: "00000000-0000-4000-8000-000000000002",
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
              id: "00000000-0000-4000-8000-000000000003",
              name: "팀장",
              department: "운영",
            },
            approvalStepCount: 3,
            ccRecipientCount: 0,
            approvalSteps: [],
            ccRecipients: [],
            jiraLinks: [],
            permissions: {
              canEdit: false,
              canSubmit: false,
              canApprove: false,
              canReject: false,
              canSyncJira: false,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const document = await submitDocument(
      "00000000-0000-4000-8000-000000000001",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/00000000-0000-4000-8000-000000000001/submit",
      {
        method: "POST",
      },
    );
    expect(document.status).toBe("PENDING");
  });

  it("sends approval actions to the approval endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          document: {
            id: "00000000-0000-4000-8000-000000000001",
            authorId: "00000000-0000-4000-8000-000000000002",
            author: {
              id: "00000000-0000-4000-8000-000000000002",
              name: "작성자",
              department: "운영",
            },
            title: "운영 계획",
            content: "본문",
            status: "APPROVED",
            submittedAt: "2026-03-26T02:00:00.000Z",
            finalApprovedAt: "2026-03-26T03:00:00.000Z",
            createdAt: "2026-03-26T00:00:00.000Z",
            updatedAt: "2026-03-26T03:00:00.000Z",
            currentStepLabel: null,
            currentApprover: null,
            approvalStepCount: 3,
            ccRecipientCount: 0,
            approvalSteps: [],
            ccRecipients: [],
            jiraLinks: [],
            permissions: {
              canEdit: false,
              canSubmit: false,
              canApprove: false,
              canReject: false,
              canSyncJira: false,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const document = await actOnDocument(
      "00000000-0000-4000-8000-000000000001",
      {
        action: "APPROVE",
      },
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/00000000-0000-4000-8000-000000000001/approval",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "APPROVE" }),
      },
    );
    expect(document.status).toBe("APPROVED");
  });

  it("sends Jira sync requests to the dedicated endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          document: {
            id: "00000000-0000-4000-8000-000000000001",
            authorId: "00000000-0000-4000-8000-000000000002",
            author: {
              id: "00000000-0000-4000-8000-000000000002",
              name: "작성자",
              department: "운영",
            },
            title: "운영 계획",
            content: "본문",
            status: "APPROVED",
            submittedAt: "2026-03-26T02:00:00.000Z",
            finalApprovedAt: "2026-03-26T03:00:00.000Z",
            createdAt: "2026-03-26T00:00:00.000Z",
            updatedAt: "2026-03-26T03:00:00.000Z",
            currentStepLabel: null,
            currentApprover: null,
            approvalStepCount: 3,
            ccRecipientCount: 0,
            approvalSteps: [],
            ccRecipients: [],
            jiraLinks: [
              {
                id: "00000000-0000-4000-8000-000000000301",
                issueKey: "KAN-1",
                issueUrl: "https://workpresso.atlassian.net/browse/KAN-1",
                issueType: "에픽",
                summary: "운영 계획",
                status: "할 일",
                syncedAt: "2026-03-30T01:00:00.000Z",
              },
            ],
            permissions: {
              canEdit: false,
              canSubmit: false,
              canApprove: false,
              canReject: false,
              canSyncJira: true,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const document = await syncDocumentToJira(
      "00000000-0000-4000-8000-000000000001",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/00000000-0000-4000-8000-000000000001/jira",
      {
        method: "POST",
      },
    );
    expect(document.jiraLinks).toHaveLength(1);
  });
});
