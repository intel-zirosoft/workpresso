import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockCreateClient,
  mockUpsertKnowledgeSource,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockUpsertKnowledgeSource: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/features/pod-c/services/knowledge-sync", async () => {
  return {
    upsertKnowledgeSource: mockUpsertKnowledgeSource,
    buildMeetingLogKnowledgeContent: vi.fn((input) =>
      [
        `회의 제목: ${input.title ?? ""}`,
        `회의 요약: ${input.summary ?? ""}`,
        input.participants?.length
          ? `참여자: ${input.participants.join(", ")}`
          : null,
        input.transcript ? `원문:\n${input.transcript}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  };
});

import { POST as postMeetingRefined } from "@/app/api/internal/pod-d/meeting-refined/route";

const validPayload = {
  meetingLogId: "00000000-0000-4000-8000-000000000101",
  title: "주간 운영 회의",
  summary: "장애 대응 프로세스 개선 논의",
  participants: ["홍길동", "김영희"],
  actionItems: [
    {
      task: "장애 대응 체크리스트 개편",
      assignee: "홍길동",
      due_date: "2026-04-02",
    },
  ],
  transcript: "오늘 회의 주제는 장애 대응 프로세스 개선입니다.",
  updatedAt: "2026-03-30T09:00:00.000Z",
};

function createRequest(body: unknown) {
  return new Request("http://localhost:3000/api/internal/pod-d/meeting-refined", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/internal/pod-d/meeting-refined", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockCreateClient.mockReset();
    mockUpsertKnowledgeSource.mockReset();
    mockFrom.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();

    mockEq.mockReturnValue({
      single: mockSingle,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await postMeetingRefined(createRequest(validPayload));

    expect(response.status).toBe(401);
    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });

    const response = await postMeetingRefined(
      createRequest({ ...validPayload, meetingLogId: "invalid-id" }),
    );

    expect(response.status).toBe(400);
    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
  });

  it("returns 404 when the meeting log does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "not found" },
    });

    const response = await postMeetingRefined(createRequest(validPayload));

    expect(response.status).toBe(404);
    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
  });

  it("returns 403 when the authenticated user does not own the meeting log", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: {
        id: validPayload.meetingLogId,
        owner_id: "00000000-0000-4000-8000-000000000999",
      },
      error: null,
    });

    const response = await postMeetingRefined(createRequest(validPayload));

    expect(response.status).toBe(403);
    expect(mockUpsertKnowledgeSource).not.toHaveBeenCalled();
  });

  it("upserts meeting knowledge when the payload and ownership are valid", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: {
        id: validPayload.meetingLogId,
        owner_id: "00000000-0000-4000-8000-000000000001",
      },
      error: null,
    });

    const response = await postMeetingRefined(createRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mockUpsertKnowledgeSource).toHaveBeenCalledTimes(1);
    expect(mockUpsertKnowledgeSource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "MEETING_LOGS",
        sourceId: validPayload.meetingLogId,
        title: validPayload.title,
        metadata: {
          owner_id: "00000000-0000-4000-8000-000000000001",
          participants: validPayload.participants,
          action_items: validPayload.actionItems,
          updated_at: validPayload.updatedAt,
        },
      }),
    );

    const upsertArg = mockUpsertKnowledgeSource.mock.calls[0]?.[0];
    expect(upsertArg.content).toContain("회의 제목: 주간 운영 회의");
    expect(upsertArg.content).toContain("회의 요약: 장애 대응 프로세스 개선 논의");
    expect(upsertArg.content).toContain("참여자: 홍길동, 김영희");
    expect(upsertArg.content).toContain("원문:");
  });
});
