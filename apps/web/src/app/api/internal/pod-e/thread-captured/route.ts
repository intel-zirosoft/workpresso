import { NextResponse } from "next/server";

import { threadCapturedPayloadSchema } from "@/features/pod-e/services/chatter-internal-contract";
import { captureThreadForKnowledge } from "@/features/pod-e/services/chatter-service";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ ok: false, message: "해당 채널에 접근할 수 없습니다." }, { status: 403 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = threadCapturedPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "thread-captured 입력값이 올바르지 않습니다.",
        errors: parsedPayload.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await captureThreadForKnowledge(user.id, parsedPayload.data);

    if (!result) {
      return forbiddenResponse();
    }

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "스레드 캡처 처리에 실패했습니다.";

    const status = message.includes("찾을 수 없습니다") ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
