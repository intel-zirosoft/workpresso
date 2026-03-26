import { NextResponse } from "next/server";

import {
  createDocumentInputSchema,
  createDocumentResponseSchema,
  documentListResponseSchema,
  documentStatusSchema,
  normalizeDocumentRow,
} from "@/features/pod-a/services/document-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const documentSelectColumns =
  "id, author_id, title, content, status, created_at, updated_at, deleted_at";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const requestUrl = new URL(request.url);
  const statusParam = requestUrl.searchParams.get("status");

  if (statusParam) {
    const parsedStatus = documentStatusSchema.safeParse(statusParam);

    if (!parsedStatus.success) {
      return NextResponse.json(
        { message: "유효한 문서 상태값이 필요합니다." },
        { status: 400 }
      );
    }
  }

  let query = adminSupabase
    .from("documents")
    .select(documentSelectColumns)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (statusParam) {
    query = query.eq("status", statusParam);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { message: "문서 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    documentListResponseSchema.parse({
      documents: (data ?? []).map(normalizeDocumentRow),
    })
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsedInput = createDocumentInputSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "문서 입력값이 올바르지 않습니다.",
        errors: parsedInput.error.flatten(),
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  if (parsedInput.data.authorId !== user.id) {
    return NextResponse.json(
      { message: "author_id가 현재 로그인한 사용자와 일치하지 않습니다." },
      { status: 403 }
    );
  }

  const { data, error } = await adminSupabase
    .from("documents")
    .insert({
      author_id: user.id,
      title: parsedInput.data.title,
      content: parsedInput.data.content,
      status: "DRAFT",
    })
    .select(documentSelectColumns)
    .single();

  if (error) {
    return NextResponse.json(
      { message: "문서를 생성하지 못했습니다." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "문서를 생성했지만 응답 데이터를 확인하지 못했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    createDocumentResponseSchema.parse({
      document: normalizeDocumentRow(data),
    }),
    { status: 201 }
  );
}
