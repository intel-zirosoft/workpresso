import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockCaptureThreadForKnowledge,
  mockCreateSystemBriefingMessage,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCaptureThreadForKnowledge: vi.fn(),
  mockCreateSystemBriefingMessage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/features/pod-e/services/chatter-service", () => ({
  captureThreadForKnowledge: mockCaptureThreadForKnowledge,
  createSystemBriefingMessage: mockCreateSystemBriefingMessage,
}));

import { POST as postThreadCaptured } from "@/app/api/internal/pod-e/thread-captured/route";
import { POST as postChannelBriefing } from "@/app/api/internal/pod-e/channels/[id]/briefing/route";

describe("Pod-E internal chatter routes", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockCaptureThreadForKnowledge.mockReset();
    mockCreateSystemBriefingMessage.mockReset();

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });
  });

  it("captures a thread through the internal thread-captured route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mockCaptureThreadForKnowledge.mockResolvedValue({
      threadId: "00000000-0000-4000-8000-000000000101",
      message: {
        id: "00000000-0000-4000-8000-000000000201",
      },
    });

    const response = await postThreadCaptured(
      new Request("http://localhost:3000/api/internal/pod-e/thread-captured", {
        method: "POST",
        body: JSON.stringify({
          channelId: "00000000-0000-4000-8000-000000000301",
          threadId: "00000000-0000-4000-8000-000000000101",
          title: "런칭 일정 조정 논의",
          summary: "디자인 QA와 배포 일정 조정 필요",
          messages: [
            {
              authorName: "홍길동",
              content: "QA를 하루 더 확보해야 합니다.",
            },
          ],
          linkedObjects: [],
          updatedAt: "2026-03-30T09:00:00.000Z",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockCaptureThreadForKnowledge).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      expect.objectContaining({
        channelId: "00000000-0000-4000-8000-000000000301",
        threadId: "00000000-0000-4000-8000-000000000101",
      }),
    );
  });

  it("creates a system briefing message through the internal briefing route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mockCreateSystemBriefingMessage.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000401",
      messageType: "SYSTEM",
    });

    const response = await postChannelBriefing(
      new Request(
        "http://localhost:3000/api/internal/pod-e/channels/00000000-0000-4000-8000-000000000301/briefing",
        {
          method: "POST",
          body: JSON.stringify({
            content: "어제 회의 요약입니다. 오늘은 QA 일정 확인이 필요합니다.",
            title: "일일 브리핑",
            linkedObjects: [],
          }),
        },
      ),
      {
        params: { id: "00000000-0000-4000-8000-000000000301" },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockCreateSystemBriefingMessage).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000301",
      expect.objectContaining({
        content: "어제 회의 요약입니다. 오늘은 QA 일정 확인이 필요합니다.",
        title: "일일 브리핑",
      }),
    );
  });
});
