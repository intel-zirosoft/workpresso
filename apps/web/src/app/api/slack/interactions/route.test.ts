import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateAdminClient, mockActOnWorkflowDocument } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  mockActOnWorkflowDocument: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/features/pod-a/services/document-server", () => ({
  actOnWorkflowDocument: mockActOnWorkflowDocument,
}));

import { POST as postSlackInteraction } from "@/app/api/slack/interactions/route";

describe("Slack interactions route", () => {
  const adminClient = { from: vi.fn() };

  beforeEach(() => {
    mockCreateAdminClient.mockReset();
    mockActOnWorkflowDocument.mockReset();
    mockCreateAdminClient.mockReturnValue(adminClient);
  });

  it("routes approve actions through the Pod A workflow engine", async () => {
    mockActOnWorkflowDocument.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      title: "운영 계획",
      status: "PENDING",
    });

    const formData = new URLSearchParams({
      payload: JSON.stringify({
        type: "block_actions",
        actions: [
          {
            action_id: "document_approve",
            value: JSON.stringify({
              documentId: "00000000-0000-4000-8000-000000000001",
              approverId: "00000000-0000-4000-8000-000000000011",
              action: "APPROVE",
            }),
          },
        ],
      }),
    });

    const response = await postSlackInteraction(
      new Request("http://localhost:3000/api/slack/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockActOnWorkflowDocument).toHaveBeenCalledWith({
      adminSupabase: adminClient,
      viewerId: "00000000-0000-4000-8000-000000000011",
      documentId: "00000000-0000-4000-8000-000000000001",
      action: "APPROVE",
    });
    expect(body.text).toContain("다음 결재 단계로 넘겼습니다");
  });

  it("returns an ephemeral error message for invalid payloads", async () => {
    const response = await postSlackInteraction(
      new Request("http://localhost:3000/api/slack/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payload: "not-json",
        }).toString(),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockActOnWorkflowDocument).not.toHaveBeenCalled();
    expect(body.text).toContain("지원하지 않는 Slack 인터랙션 요청");
  });
});
