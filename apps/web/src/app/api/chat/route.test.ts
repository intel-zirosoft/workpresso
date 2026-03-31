import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockCreateAdminClient,
  mockCreateEmbedding,
  mockGetChatLanguageModel,
  mockCreateScheduleViaPodBApi,
  mockGenerateText,
  mockConvertToCoreMessages,
  mockCreateDataStreamResponse,
  mockFormatDataStreamPart,
  mockTool,
  mockRpc,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockCreateEmbedding: vi.fn(),
  mockGetChatLanguageModel: vi.fn(),
  mockCreateScheduleViaPodBApi: vi.fn(),
  mockGenerateText: vi.fn(),
  mockConvertToCoreMessages: vi.fn(),
  mockCreateDataStreamResponse: vi.fn(),
  mockFormatDataStreamPart: vi.fn(),
  mockTool: vi.fn(),
  mockRpc: vi.fn(),
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

vi.mock("ai", () => ({
  createDataStreamResponse: mockCreateDataStreamResponse,
  convertToCoreMessages: mockConvertToCoreMessages,
  formatDataStreamPart: mockFormatDataStreamPart,
  generateText: mockGenerateText,
  tool: mockTool,
}));

import { POST as postChat } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockCreateAdminClient.mockReset();
    mockCreateEmbedding.mockReset();
    mockGetChatLanguageModel.mockReset();
    mockCreateScheduleViaPodBApi.mockReset();
    mockGenerateText.mockReset();
    mockConvertToCoreMessages.mockReset();
    mockCreateDataStreamResponse.mockReset();
    mockFormatDataStreamPart.mockReset();
    mockTool.mockReset();
    mockRpc.mockReset();

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });
    mockCreateAdminClient.mockReturnValue({
      rpc: mockRpc,
    });
    mockGetChatLanguageModel.mockResolvedValue("mock-model");
    mockCreateEmbedding.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    });
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });
    mockConvertToCoreMessages.mockImplementation((messages) => messages);
    mockFormatDataStreamPart.mockImplementation((type, value) => `${type}:${JSON.stringify(value)}`);
    mockCreateDataStreamResponse.mockImplementation(({ execute }) => {
      const writes: string[] = [];
      execute({
        write: (data: string) => {
          writes.push(data);
        },
        writeData: vi.fn(),
        writeMessageAnnotation: vi.fn(),
        writeSource: vi.fn(),
        merge: vi.fn(),
        onError: undefined,
      });

      return new Response(writes.join("\n"), {
        status: 200,
      });
    });
    mockTool.mockImplementation((config) => config);
    mockGenerateText.mockResolvedValue({
      text: "ok",
      finishReason: "stop",
      usage: {
        promptTokens: 1,
        completionTokens: 1,
      },
    });
  });

  it("injects the re-ask rules into the chat system prompt for ambiguous schedule intent", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
        },
      },
      error: null,
    });

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "내일쯤 디자인 리뷰 일정 잡아줘",
          },
        ],
      }),
    });

    const response = await postChat(request);

    expect(response.status).toBe(200);
    expect(mockCreateScheduleViaPodBApi).not.toHaveBeenCalled();
    expect(mockGenerateText).toHaveBeenCalledTimes(1);

    const streamCall = mockGenerateText.mock.calls[0]?.[0];
    expect(streamCall.system).toContain(
      "일정 생성 전에 title, start_time, end_time을 확정할 근거가 부족하면 tool을 호출하지 말고 먼저 짧게 재질문하세요.",
    );
    expect(streamCall.system).toContain(
      "참석자 식별이 모호하면 attendee_ids를 추정하지 말고 후보를 제시하거나 다시 물어보세요.",
    );
    expect(streamCall.system).toContain("기준 시간대:");
    expect(streamCall.tools.create_schedule.description).toContain(
      "불충분하면 먼저 재질문하세요.",
    );
  });

  it("routes create_schedule tool execution through the Pod-B adapter", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
        },
      },
      error: null,
    });
    mockCreateScheduleViaPodBApi.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000111",
      title: "디자인 리뷰",
      start_time: "2026-03-31T05:00:00.000Z",
      end_time: "2026-03-31T06:00:00.000Z",
      type: "MEETING",
      description: "Pod-C가 회의 메모를 바탕으로 생성",
      attendee_ids: ["00000000-0000-4000-8000-000000000201"],
      link: "http://localhost:3000/schedules",
    });
    mockGenerateText.mockImplementation(async (options) => {
      await options.tools.create_schedule.execute({
        title: "디자인 리뷰",
        start_time: "2026-03-31T05:00:00.000Z",
        end_time: "2026-03-31T06:00:00.000Z",
        type: "MEETING",
        description: "Pod-C가 회의 메모를 바탕으로 생성",
        attendee_ids: ["00000000-0000-4000-8000-000000000201"],
      });

      return {
        text: "일정 등록을 완료했습니다.",
        finishReason: "stop",
        usage: {
          promptTokens: 1,
          completionTokens: 1,
        },
      };
    });

    const request = new Request("http://localhost:3000/api/chat", {
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
    });

    const response = await postChat(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(mockCreateScheduleViaPodBApi).toHaveBeenCalledTimes(1);
    expect(mockCreateScheduleViaPodBApi).toHaveBeenCalledWith({
      payload: {
        title: "디자인 리뷰",
        start_time: "2026-03-31T05:00:00.000Z",
        end_time: "2026-03-31T06:00:00.000Z",
        type: "MEETING",
        description: "Pod-C가 회의 메모를 바탕으로 생성",
        attendee_ids: ["00000000-0000-4000-8000-000000000201"],
      },
      request,
    });
    expect(body).toContain("일정 등록을 완료했습니다.");
  });
});
