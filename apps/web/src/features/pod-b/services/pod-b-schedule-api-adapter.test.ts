import { afterEach, describe, expect, it, vi } from "vitest";

import { createScheduleViaPodBApi } from "@/features/pod-b/services/pod-b-schedule-api-adapter";

describe("createScheduleViaPodBApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the Pod-B schedule API with the normalized payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "00000000-0000-4000-8000-000000000101",
        title: "디자인 리뷰",
        start_time: "2026-03-31T05:00:00.000Z",
        end_time: "2026-03-31T06:00:00.000Z",
        type: "MEETING",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createScheduleViaPodBApi({
      payload: {
        title: "디자인 리뷰",
        start_time: "2026-03-31T05:00:00.000Z",
        end_time: "2026-03-31T06:00:00.000Z",
        type: "MEETING",
        description: "Pod-C가 회의 메모를 바탕으로 생성",
        attendee_ids: ["00000000-0000-4000-8000-000000000201"],
      },
      request: new Request("http://localhost:3000/api/chat", {
        headers: {
          cookie: "sb-access-token=test",
        },
      }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://localhost:3000/api/schedules"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          cookie: "sb-access-token=test",
        }),
        body: JSON.stringify({
          title: "디자인 리뷰",
          start_time: "2026-03-31T05:00:00.000Z",
          end_time: "2026-03-31T06:00:00.000Z",
          type: "MEETING",
        }),
      }),
    );

    expect(result).toEqual({
      id: "00000000-0000-4000-8000-000000000101",
      title: "디자인 리뷰",
      start_time: "2026-03-31T05:00:00.000Z",
      end_time: "2026-03-31T06:00:00.000Z",
      type: "MEETING",
      description: "Pod-C가 회의 메모를 바탕으로 생성",
      attendee_ids: ["00000000-0000-4000-8000-000000000201"],
      link: "http://localhost:3000/schedules",
    });
  });

  it("throws the Pod-B API error message when schedule creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: "유효한 시작 시간을 입력해주세요 (ISO 8601).",
        }),
      }),
    );

    await expect(
      createScheduleViaPodBApi({
        payload: {
          title: "디자인 리뷰",
          start_time: "2026-03-31T05:00:00.000Z",
          end_time: "2026-03-31T06:00:00.000Z",
          type: "MEETING",
        },
        request: new Request("http://localhost:3000/api/chat"),
      }),
    ).rejects.toThrow("유효한 시작 시간을 입력해주세요 (ISO 8601).");
  });
});
