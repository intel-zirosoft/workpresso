import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockCreateAdminClient,
  mockCreateEmbedding,
  mockGetChatLanguageModel,
  mockCreateScheduleViaPodBApi,
  mockStreamText,
  mockConvertToCoreMessages,
  mockTool,
  mockRpc,
  mockUpsertKnowledgeSource,
  mockBuildScheduleKnowledgeContent,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockCreateEmbedding: vi.fn(),
  mockGetChatLanguageModel: vi.fn(),
  mockCreateScheduleViaPodBApi: vi.fn(),
  mockStreamText: vi.fn(),
  mockConvertToCoreMessages: vi.fn(),
  mockTool: vi.fn(),
  mockRpc: vi.fn(),
  mockUpsertKnowledgeSource: vi.fn(),
  mockBuildScheduleKnowledgeContent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/ai/embeddings", () => ({
  createEmbedding: mockCreateEmbedding,
}));

vi.mock("@/lib/ai/chat", () => ({
  getChatLanguageModel: mockGetChatLanguageModel,
}));

vi.mock("@/features/pod-b/services/pod-b-schedule-api-adapter", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/pod-b/services/pod-b-schedule-api-adapter")
  >("@/features/pod-b/services/pod-b-schedule-api-adapter");

  return {
    ...actual,
    createScheduleViaPodBApi: mockCreateScheduleViaPodBApi,
  };
});

vi.mock("@/features/pod-c/services/knowledge-sync", () => ({
  upsertKnowledgeSource: mockUpsertKnowledgeSource,
  buildScheduleKnowledgeContent: mockBuildScheduleKnowledgeContent,
}));

vi.mock("ai", () => ({
  convertToCoreMessages: mockConvertToCoreMessages,
  streamText: mockStreamText,
  tool: mockTool,
}));

import { POST as postChat } from "@/app/api/chat/route";
import { POST as postSchedule } from "@/app/api/schedules/route";

const createdUserIds = new Set<string>();
const createdScheduleIds = new Set<string>();

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
      name: `Pod B Chat Integration ${userId.slice(0, 8)}`,
      department: "QA",
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create integration test user.");
  }

  createdUserIds.add(userId);
  return data;
}

async function cleanupCreatedRecords() {
  if (createdScheduleIds.size > 0) {
    const scheduleIds = Array.from(createdScheduleIds);
    createdScheduleIds.clear();

    const { error } = await adminSupabase
      .from("schedules")
      .delete()
      .in("id", scheduleIds);

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

describe("POST /api/chat schedule integration", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockCreateAdminClient.mockReset();
    mockCreateEmbedding.mockReset();
    mockGetChatLanguageModel.mockReset();
    mockCreateScheduleViaPodBApi.mockReset();
    mockStreamText.mockReset();
    mockConvertToCoreMessages.mockReset();
    mockTool.mockReset();
    mockRpc.mockReset();
    mockUpsertKnowledgeSource.mockReset();
    mockBuildScheduleKnowledgeContent.mockReset();

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: (...args: Parameters<typeof adminSupabase.from>) =>
        adminSupabase.from(...args),
    });
    mockCreateAdminClient.mockReturnValue({
      rpc: mockRpc,
    });
    mockCreateEmbedding.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    });
    mockGetChatLanguageModel.mockResolvedValue("mock-model");
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });
    mockConvertToCoreMessages.mockImplementation((messages) => messages);
    mockTool.mockImplementation((config) => config);
    mockBuildScheduleKnowledgeContent.mockImplementation(
      ({ title, startTime, endTime, type }) =>
        [
          `일정 제목: ${title}`,
          `일정 유형: ${type ?? "TASK"}`,
          `시작 시간: ${startTime}`,
          `종료 시간: ${endTime}`,
        ].join("\n"),
    );
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await cleanupCreatedRecords();
  });

  it("creates a real schedule through /api/chat -> adapter -> /api/schedules", async () => {
    const user = await createTestUser();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: user.id,
        },
      },
      error: null,
    });

    mockCreateScheduleViaPodBApi.mockImplementation(async ({ payload, request }) => {
      const scheduleResponse = await postSchedule(
        new Request("http://localhost:3000/api/schedules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(request.headers.get("cookie")
              ? { cookie: request.headers.get("cookie") as string }
              : {}),
          },
          body: JSON.stringify({
            title: payload.title,
            start_time: payload.start_time,
            end_time: payload.end_time,
            type: payload.type,
          }),
        }),
      );

      if (!scheduleResponse.ok) {
        const errorPayload = await scheduleResponse.json();
        throw new Error(errorPayload.error ?? "일정 생성에 실패했습니다.");
      }

      const createdSchedule = await scheduleResponse.json();

      return {
        ...createdSchedule,
        description: payload.description ?? null,
        attendee_ids: payload.attendee_ids ?? [],
        link: "http://localhost:3000/schedules",
      };
    });

    mockStreamText.mockImplementation(async (options) => {
      const toolResult = await options.tools.create_schedule.execute({
        title: "디자인 리뷰",
        start_time: "2026-03-31T05:00:00.000Z",
        end_time: "2026-03-31T06:00:00.000Z",
        type: "MEETING",
        description: "Pod-C가 회의 메모를 바탕으로 생성",
        attendee_ids: [],
      });

      return {
        toDataStreamResponse: () => Response.json({ toolResult }),
      };
    });

    const response = await postChat(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          cookie: "sb-access-token=test",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "내일 오후 2시에 디자인 리뷰 일정 잡아줘",
            },
          ],
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.toolResult.message).toBe("일정 '디자인 리뷰' 등록 완료");
    expect(body.toolResult.schedule.link).toBe("http://localhost:3000/schedules");
    expect(mockUpsertKnowledgeSource).toHaveBeenCalledTimes(1);

    const createdScheduleId = body.toolResult.schedule.id;
    createdScheduleIds.add(createdScheduleId);

    const { data: storedSchedule, error } = await adminSupabase
      .from("schedules")
      .select("id, user_id, title, start_time, end_time")
      .eq("id", createdScheduleId)
      .single();

    expect(error).toBeNull();
    expect(storedSchedule).toMatchObject({
      id: createdScheduleId,
      user_id: user.id,
      title: "디자인 리뷰",
      start_time: "2026-03-31T05:00:00+00:00",
      end_time: "2026-03-31T06:00:00+00:00",
    });
  });
});
