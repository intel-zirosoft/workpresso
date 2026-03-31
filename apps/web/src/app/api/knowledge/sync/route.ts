import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  removeKnowledgeSource,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import {
  removeKnowledgeSourceInputSchema,
  upsertKnowledgeSourceInputSchema,
} from "@/features/pod-c/services/knowledge-contract";
import { createClient } from "@/lib/supabase/server";

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
    const payload = upsertKnowledgeSourceInputSchema.parse(await request.json());

    await upsertKnowledgeSource(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

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
    const payload = removeKnowledgeSourceInputSchema.parse(
      await request.json(),
    );

    await removeKnowledgeSource(payload);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "지식 삭제에 실패했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
