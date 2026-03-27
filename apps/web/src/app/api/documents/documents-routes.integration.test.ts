import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockCreateClient } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET as getDocuments, POST as postDocument } from "@/app/api/documents/route";
import { PATCH as patchDocument } from "@/app/api/documents/[id]/route";
import { PATCH as patchDocumentStatus } from "@/app/api/documents/[id]/status/route";

function loadIntegrationEnv() {
  const envFileCandidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "apps/web/.env.local"),
  ];

  const envFilePath = envFileCandidates.find((candidate) => fs.existsSync(candidate));

  if (!envFilePath) {
    return;
  }

  const envLines = fs.readFileSync(envFilePath, "utf8").split(/\r?\n/);

  for (const line of envLines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

loadIntegrationEnv();

const createdDocumentIds = new Set<string>();
const createdUserIds = new Set<string>();

function createAdminTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase integration test environment variables are missing.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const adminSupabase = createAdminTestClient();

async function createTestUser() {
  const userId = randomUUID();
  const { data, error } = await adminSupabase
    .from("users")
    .insert({
      id: userId,
      name: `Pod A Integration ${userId.slice(0, 8)}`,
      department: "QA",
      status: "ACTIVE",
    })
    .select("id, name, department, status")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create integration test user.");
  }

  createdUserIds.add(userId);

  return data;
}

async function createWorkflowParticipants() {
  const [firstApprover, secondApprover, thirdApprover, ccRecipient] =
    await Promise.all([
      createTestUser(),
      createTestUser(),
      createTestUser(),
      createTestUser(),
    ]);

  return {
    approvalSteps: [
      {
        stepLabel: "팀장",
        approverId: firstApprover.id,
      },
      {
        stepLabel: "부서장",
        approverId: secondApprover.id,
      },
      {
        stepLabel: "대표",
        approverId: thirdApprover.id,
      },
    ],
    ccRecipientIds: [ccRecipient.id],
  };
}

async function createTestDocument(
  authorId: string,
  overrides?: Partial<{
    title: string;
    content: string;
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  }>
) {
  const { data, error } = await adminSupabase
    .from("documents")
    .insert({
      author_id: authorId,
      title: overrides?.title ?? `Pod A 문서 ${randomUUID().slice(0, 8)}`,
      content: overrides?.content ?? "통합 테스트 본문",
      status: overrides?.status ?? "DRAFT",
    })
    .select("id, author_id, title, content, status, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create integration test document.");
  }

  createdDocumentIds.add(data.id);

  return data;
}

async function cleanupCreatedRecords() {
  if (createdDocumentIds.size > 0) {
    const documentIds = Array.from(createdDocumentIds);
    createdDocumentIds.clear();

    const { error } = await adminSupabase.from("documents").delete().in("id", documentIds);

    if (error) {
      throw error;
    }
  }

  if (createdUserIds.size > 0) {
    const userIds = Array.from(createdUserIds);
    createdUserIds.clear();

    const { error } = await adminSupabase.from("users").delete().in("id", userIds);

    if (error) {
      throw error;
    }
  }
}

describe("Pod A document routes integration", () => {
  beforeAll(async () => {
    const { error } = await adminSupabase.from("users").select("id").limit(1);

    if (error) {
      throw error;
    }
  });

  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await cleanupCreatedRecords();
  });

  it("creates a real draft document in Supabase", async () => {
    const user = await createTestUser();
    const workflowParticipants = await createWorkflowParticipants();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: user.id,
        },
      },
      error: null,
    });

    const response = await postDocument(
      new Request("http://localhost:3000/api/documents", {
        method: "POST",
        body: JSON.stringify({
          authorId: user.id,
          title: "통합 테스트 초안",
          content: "실제 Supabase DB에 저장되는지 확인합니다.",
          approvalSteps: workflowParticipants.approvalSteps,
          ccRecipientIds: workflowParticipants.ccRecipientIds,
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.document.status).toBe("DRAFT");
    expect(body.document.authorId).toBe(user.id);

    createdDocumentIds.add(body.document.id);

    const { data: storedDocument, error } = await adminSupabase
      .from("documents")
      .select("id, author_id, title, content, status")
      .eq("id", body.document.id)
      .single();

    expect(error).toBeNull();
    expect(storedDocument).toMatchObject({
      id: body.document.id,
      author_id: user.id,
      title: "통합 테스트 초안",
      content: "실제 Supabase DB에 저장되는지 확인합니다.",
      status: "DRAFT",
    });
  });

  it("reads only the authenticated author's documents with the requested status", async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();

    const matchingDocument = await createTestDocument(user.id, {
      title: "내 결재 대기 문서",
      status: "PENDING",
    });
    await createTestDocument(user.id, {
      title: "내 초안",
      status: "DRAFT",
    });
    await createTestDocument(otherUser.id, {
      title: "다른 사람 문서",
      status: "PENDING",
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: user.id,
        },
      },
      error: null,
    });

    const response = await getDocuments(
      new Request("http://localhost:3000/api/documents?status=PENDING")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0]).toMatchObject({
      id: matchingDocument.id,
      title: "내 결재 대기 문서",
      status: "PENDING",
      authorId: user.id,
    });
  });

  it("updates a real document row in Supabase", async () => {
    const user = await createTestUser();
    const workflowParticipants = await createWorkflowParticipants();
    const document = await createTestDocument(user.id, {
      title: "수정 전 제목",
      content: "수정 전 본문",
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: user.id,
        },
      },
      error: null,
    });

    const response = await patchDocument(
      new Request(`http://localhost:3000/api/documents/${document.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "수정 후 제목",
          content: "수정 후 본문",
          approvalSteps: workflowParticipants.approvalSteps,
          ccRecipientIds: workflowParticipants.ccRecipientIds,
        }),
      }),
      { params: { id: document.id } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.title).toBe("수정 후 제목");
    expect(body.document.content).toBe("수정 후 본문");

    const { data: storedDocument, error } = await adminSupabase
      .from("documents")
      .select("title, content")
      .eq("id", document.id)
      .single();

    expect(error).toBeNull();
    expect(storedDocument).toMatchObject({
      title: "수정 후 제목",
      content: "수정 후 본문",
    });
  });

  it("returns 410 for the deprecated direct status route", async () => {
    const user = await createTestUser();
    const document = await createTestDocument(user.id, {
      title: "승인 대상 문서",
      status: "PENDING",
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: user.id,
        },
      },
      error: null,
    });
    const response = await patchDocumentStatus(
      new Request(`http://localhost:3000/api/documents/${document.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "APPROVED",
        }),
      }),
      { params: { id: document.id } }
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.message).toContain("/submit");
    expect(body.message).toContain("/approval");

    const { data: storedDocument, error } = await adminSupabase
      .from("documents")
      .select("status")
      .eq("id", document.id)
      .single();

    expect(error).toBeNull();
    expect(storedDocument).toMatchObject({
      status: "PENDING",
    });
  });
});
