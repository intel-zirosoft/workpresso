import { NextResponse } from "next/server";
import { z } from "zod";

import {
  removeKnowledgeSource,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { createClient } from "@/lib/supabase/server";

const sourceTypeSchema = z.enum(["DOCUMENTS", "MEETING_LOGS", "SCHEDULES"]);

const upsertSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceId: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().min(1, "적재할 텍스트가 필요합니다."),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const deleteSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceId: z.string().uuid(),
});

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const payload = upsertSchema.parse(await request.json());

    await upsertKnowledgeSource({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      title: payload.title,
      content: payload.content,
      metadata: payload.metadata as Record<string, never> | undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "지식 동기화에 실패했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const payload = deleteSchema.parse(await request.json());

    await removeKnowledgeSource({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "지식 삭제에 실패했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
