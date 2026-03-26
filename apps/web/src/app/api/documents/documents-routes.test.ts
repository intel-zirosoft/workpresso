import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockFrom,
  mockCreateAdminClient,
  mockFetch,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

import { GET as getDocuments, POST as postDocument } from "@/app/api/documents/route";
import { PATCH as patchDocument } from "@/app/api/documents/[id]/route";
import { PATCH as patchDocumentStatus } from "@/app/api/documents/[id]/status/route";

function buildAwaitableSelectQuery(result: { data: unknown; error: unknown }) {
  const query = {} as {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    then: Promise<typeof result>["then"];
  };

  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.is = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

  return query;
}

function buildMutationQuery(
  result: { data: unknown; error: unknown },
  method: "insert" | "update"
) {
  const query = {} as {
    select: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    insert?: ReturnType<typeof vi.fn>;
    update?: ReturnType<typeof vi.fn>;
  };

  query.select = vi.fn(() => query);
  query.single = vi.fn().mockResolvedValue(result);
  query.eq = vi.fn(() => query);
  query.is = vi.fn(() => query);
  query[method] = vi.fn(() => query);

  return query;
}

describe("Pod A document routes", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockFrom.mockReset();
    mockCreateAdminClient.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });
    mockCreateAdminClient.mockReturnValue({
      from: mockFrom,
    });

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://workpresso.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("returns a filtered document list for the authenticated author", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const query = buildAwaitableSelectQuery({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          author_id: "00000000-0000-4000-8000-000000000010",
          title: "결재 대기 문서",
          content: "본문",
          status: "PENDING",
          created_at: "2026-03-26T00:00:00.000Z",
          updated_at: "2026-03-26T01:00:00.000Z",
          deleted_at: null,
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(query);

    const response = await getDocuments(
      new Request("http://localhost:3000/api/documents?status=PENDING")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(query.eq).toHaveBeenNthCalledWith(1, "author_id", "00000000-0000-4000-8000-000000000010");
    expect(query.eq).toHaveBeenNthCalledWith(2, "status", "PENDING");
    expect(body.documents).toEqual([
      expect.objectContaining({
        title: "결재 대기 문서",
        status: "PENDING",
      }),
    ]);
  });

  it("creates a draft document only for the logged-in author", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const query = buildMutationQuery(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          author_id: "00000000-0000-4000-8000-000000000010",
          title: "새 문서",
          content: "본문",
          status: "DRAFT",
          created_at: "2026-03-26T00:00:00.000Z",
          updated_at: "2026-03-26T01:00:00.000Z",
          deleted_at: null,
        },
        error: null,
      },
      "insert"
    );
    mockFrom.mockReturnValue(query);

    const response = await postDocument(
      new Request("http://localhost:3000/api/documents", {
        method: "POST",
        body: JSON.stringify({
          authorId: "00000000-0000-4000-8000-000000000010",
          title: "새 문서",
          content: "본문",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith({
      author_id: "00000000-0000-4000-8000-000000000010",
      title: "새 문서",
      content: "본문",
      status: "DRAFT",
    });
    expect(body.document.status).toBe("DRAFT");
  });

  it("rejects document creation when authorId does not match the session user", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const response = await postDocument(
      new Request("http://localhost:3000/api/documents", {
        method: "POST",
        body: JSON.stringify({
          authorId: "00000000-0000-4000-8000-000000000011",
          title: "새 문서",
          content: "본문",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toContain("author_id");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 404 when the document update target does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const query = buildMutationQuery(
      {
        data: null,
        error: { code: "PGRST116" },
      },
      "update"
    );
    mockFrom.mockReturnValue(query);

    const response = await patchDocument(
      new Request("http://localhost:3000/api/documents/unknown", {
        method: "PATCH",
        body: JSON.stringify({
          title: "수정된 제목",
          content: "수정된 본문",
        }),
      }),
      { params: { id: "unknown" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("수정할 문서를 찾지 못했습니다.");
  });

  it("returns 404 when the status update target does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const query = buildMutationQuery(
      {
        data: null,
        error: { code: "PGRST116" },
      },
      "update"
    );
    mockFrom.mockReturnValue(query);

    const response = await patchDocumentStatus(
      new Request("http://localhost:3000/api/documents/unknown/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: "APPROVED",
        }),
      }),
      { params: { id: "unknown" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("상태를 변경할 문서를 찾지 못했습니다.");
  });

  it("calls the knowledge sync edge function when a document is approved", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000010",
        },
      },
      error: null,
    });

    const query = buildMutationQuery(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          author_id: "00000000-0000-4000-8000-000000000010",
          title: "운영 계획",
          content: "본문",
          status: "APPROVED",
          created_at: "2026-03-26T00:00:00.000Z",
          updated_at: "2026-03-26T01:00:00.000Z",
          deleted_at: null,
        },
        error: null,
      },
      "update"
    );
    mockFrom.mockReturnValue(query);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const response = await patchDocumentStatus(
      new Request("http://localhost:3000/api/documents/0001/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: "APPROVED",
        }),
      }),
      { params: { id: "00000000-0000-4000-8000-000000000001" } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://workpresso.supabase.co/functions/v1/document-knowledge-sync",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer service-role-key",
          apikey: "service-role-key",
        }),
      })
    );
    expect(JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body))).toEqual(
      expect.objectContaining({
        action: "upsert",
        documentId: "00000000-0000-4000-8000-000000000001",
      })
    );
    expect(body.document.status).toBe("APPROVED");
  });
});
