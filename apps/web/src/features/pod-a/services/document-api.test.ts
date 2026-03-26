import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  DocumentApiError,
  createDocument,
  fetchDocuments,
  updateDocumentStatus,
} from "@/features/pod-a/services/document-api";

const mockFetch = vi.fn();

describe("document-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("requests the filtered document list with no-store caching", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              authorId: "00000000-0000-4000-8000-000000000002",
              title: "결재 대기 문서",
              content: "본문",
              status: "PENDING",
              createdAt: "2026-03-26T00:00:00.000Z",
              updatedAt: "2026-03-26T01:00:00.000Z",
            },
          ],
        }),
        { status: 200 }
      )
    );

    const documents = await fetchDocuments("PENDING");

    expect(mockFetch).toHaveBeenCalledWith("/api/documents?status=PENDING", {
      method: "GET",
      cache: "no-store",
    });
    expect(documents).toHaveLength(1);
    expect(documents[0]?.status).toBe("PENDING");
  });

  it("throws a domain error when the API responds with a failure message", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "문서 목록을 불러오지 못했습니다." }),
        { status: 500 }
      )
    );

    await expect(fetchDocuments()).rejects.toEqual(
      expect.objectContaining<DocumentApiError>({
        name: "DocumentApiError",
        message: "문서 목록을 불러오지 못했습니다.",
      })
    );
  });

  it("validates create payloads before sending the request", async () => {
    await expect(
      createDocument({
        authorId: "00000000-0000-4000-8000-000000000001",
        title: "   ",
        content: "본문",
      })
    ).rejects.toBeInstanceOf(ZodError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends status updates to the dedicated status endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          document: {
            id: "00000000-0000-4000-8000-000000000001",
            authorId: "00000000-0000-4000-8000-000000000002",
            title: "운영 계획",
            content: "본문",
            status: "APPROVED",
            createdAt: "2026-03-26T00:00:00.000Z",
            updatedAt: "2026-03-26T01:00:00.000Z",
          },
        }),
        { status: 200 }
      )
    );

    const document = await updateDocumentStatus(
      "00000000-0000-4000-8000-000000000001",
      "APPROVED"
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/00000000-0000-4000-8000-000000000001/status",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      }
    );
    expect(document.status).toBe("APPROVED");
  });
});
