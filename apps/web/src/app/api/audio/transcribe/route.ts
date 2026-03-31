import { NextResponse } from "next/server";

import { transcribeAudioWithOpenRouter } from "@/lib/ai/audio";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "음성 기능을 사용하려면 로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const prompt = formData.get("prompt");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "오디오 파일이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await transcribeAudioWithOpenRouter({
      audioBuffer: Buffer.from(arrayBuffer),
      mimeType: file.type,
      fileName: file.name,
      prompt: typeof prompt === "string" ? prompt : undefined,
    });

    return NextResponse.json({ text: result.text, model: result.model });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "음성 전사 중 오류가 발생했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
