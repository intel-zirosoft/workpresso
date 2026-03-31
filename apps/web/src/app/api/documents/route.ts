import { NextResponse } from "next/server";

import {
  createDocumentInputSchema,
  documentListResponseSchema,
  documentResponseSchema,
  documentScopeSchema,
  documentStatusSchema,
} from "@/features/pod-a/services/document-schema";
import {
  createWorkflowDocument,
  listDocumentsForViewer,
} from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 },
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
  const scopeParam = requestUrl.searchParams.get("scope") ?? "authored";
  const statusParam = requestUrl.searchParams.get("status");
  const parsedScope = documentScopeSchema.safeParse(scopeParam);

  if (!parsedScope.success) {
    return NextResponse.json(
      { message: "유효한 문서 scope 값이 필요합니다." },
      { status: 400 },
    );
  }

  if (statusParam) {
    const parsedStatus = documentStatusSchema.safeParse(statusParam);

    if (!parsedStatus.success) {
      return NextResponse.json(
        { message: "유효한 문서 상태값이 필요합니다." },
        { status: 400 },
      );
    }
  }

  try {
    const documents = await listDocumentsForViewer({
      adminSupabase,
      viewerId: user.id,
      scope: parsedScope.data,
      status: statusParam ? documentStatusSchema.parse(statusParam) : undefined,
    });

    return NextResponse.json(
      documentListResponseSchema.parse({
        documents,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "문서 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
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
      { status: 400 },
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
      { status: 403 },
    );
  }

  try {
    const document = await createWorkflowDocument({
      adminSupabase,
      viewerId: user.id,
      title: parsedInput.data.title,
      content: parsedInput.data.content,
      approvalSteps: parsedInput.data.approvalSteps,
      ccRecipientIds: parsedInput.data.ccRecipientIds,
    });

    return NextResponse.json(
      documentResponseSchema.parse({
        document,
      }),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "문서를 생성하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
