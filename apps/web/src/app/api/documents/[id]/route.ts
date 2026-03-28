import { NextResponse } from "next/server";

import {
  documentResponseSchema,
  updateDocumentInputSchema,
} from "@/features/pod-a/services/document-schema";
import {
  getDocumentDetailForViewer,
  updateWorkflowDocument,
} from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  try {
    const document = await getDocumentDetailForViewer({
      adminSupabase,
      documentId: params.id,
      viewerId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { message: "문서를 찾지 못했거나 접근 권한이 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      documentResponseSchema.parse({
        document,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "문서 상세를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const payload = await request.json().catch(() => null);
  const parsedInput = updateDocumentInputSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "문서 수정 입력값이 올바르지 않습니다.",
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

  try {
    const document = await updateWorkflowDocument({
      adminSupabase,
      viewerId: user.id,
      documentId: params.id,
      title: parsedInput.data.title,
      content: parsedInput.data.content,
      approvalSteps: parsedInput.data.approvalSteps,
      ccRecipientIds: parsedInput.data.ccRecipientIds,
    });

    if (!document) {
      return NextResponse.json(
        { message: "수정할 문서를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      documentResponseSchema.parse({
        document,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "문서를 수정하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
