import { NextResponse } from "next/server";

import { systemBriefingPayloadSchema } from "@/features/pod-e/services/chatter-internal-contract";
import { createSystemBriefingMessage } from "@/features/pod-e/services/chatter-service";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ ok: false, message: "해당 채널에 접근할 수 없습니다." }, { status: 403 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = systemBriefingPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "브리핑 입력값이 올바르지 않습니다.",
        errors: parsedPayload.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const message = await createSystemBriefingMessage(
      user.id,
      params.id,
      parsedPayload.data,
    );

    if (!message) {
      return forbiddenResponse();
    }

    return NextResponse.json({
      ok: true,
      data: {
        message,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "시스템 브리핑 메시지 전송에 실패했습니다.";

    const status = message.includes("찾을 수 없습니다") ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
