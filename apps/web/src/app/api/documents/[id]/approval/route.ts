import { NextResponse } from "next/server";

import {
  approvalActionInputSchema,
  documentResponseSchema,
} from "@/features/pod-a/services/document-schema";
import { actOnWorkflowDocument } from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const payload = await request.json().catch(() => null);
  const parsedInput = approvalActionInputSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "승인 액션 입력값이 올바르지 않습니다.",
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
    const document = await actOnWorkflowDocument({
      adminSupabase,
      viewerId: user.id,
      documentId: params.id,
      action: parsedInput.data.action,
      comment: parsedInput.data.comment,
    });

    if (!document) {
      return NextResponse.json(
        { message: "승인 처리할 문서를 찾지 못했습니다." },
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
          error instanceof Error ? error.message : "승인 처리를 완료하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
