import { NextResponse } from "next/server";

import {
  createChannelMessage,
  getChannelMessages,
  parseCreateChatterMessageInput,
} from "@/features/pod-e/services/chatter-service";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json({ message: "메신저를 사용하려면 로그인이 필요합니다." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ message: "해당 채널에 접근할 수 없습니다." }, { status: 403 });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  try {
    const payload = await getChannelMessages(user.id, params.id);

    if (!payload) {
      return forbiddenResponse();
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "채널 메시지를 불러오지 못했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
  const parsedInput = parseCreateChatterMessageInput(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "메시지 입력값이 올바르지 않습니다.",
        errors: parsedInput.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const message = await createChannelMessage(user.id, params.id, parsedInput.data);

    if (!message) {
      return forbiddenResponse();
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "메시지를 저장하지 못했습니다.";
    const status = message.includes("찾을 수 없습니다") ? 404 : 500;

    return NextResponse.json({ message }, { status });
  }
}
