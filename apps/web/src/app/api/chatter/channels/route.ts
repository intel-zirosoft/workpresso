import { NextResponse } from "next/server";

import { listUserChannels } from "@/features/pod-e/services/chatter-service";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json({ message: "채터를 사용하려면 로그인이 필요합니다." }, { status: 401 });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  try {
    const channels = await listUserChannels(user.id);
    return NextResponse.json({ channels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "채널 목록을 불러오지 못했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
