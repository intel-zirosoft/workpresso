import { NextResponse } from "next/server";

import {
  createDocumentResponseSchema,
  normalizeDocumentRow,
  updateDocumentInputSchema,
} from "@/features/pod-a/services/document-schema";
import { createClient } from "@/lib/supabase/server";

const documentSelectColumns =
  "id, author_id, title, content, status, created_at, updated_at, deleted_at";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsedInput = updateDocumentInputSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "문서 수정 입력값이 올바르지 않습니다.",
        errors: parsedInput.error.flatten(),
      },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      title: parsedInput.data.title,
      content: parsedInput.data.content,
    })
    .eq("id", params.id)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .select(documentSelectColumns)
    .single();

  if (error) {
    return NextResponse.json(
      { message: "문서를 수정하지 못했습니다." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "수정할 문서를 찾지 못했습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    createDocumentResponseSchema.parse({
      document: normalizeDocumentRow(data),
    })
  );
}
