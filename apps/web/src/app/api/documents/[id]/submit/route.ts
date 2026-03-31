import { NextResponse } from "next/server";

import { documentResponseSchema } from "@/features/pod-a/services/document-schema";
import { submitWorkflowDocument } from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "문서 기능을 사용하려면 로그인이 필요합니다." },
    { status: 401 },
  );
}

export async function POST(
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
    const document = await submitWorkflowDocument({
      adminSupabase,
      viewerId: user.id,
      documentId: params.id,
    });

    if (!document) {
      return NextResponse.json(
        { message: "제출할 문서를 찾지 못했습니다." },
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
            : "문서를 결재 요청 상태로 변경하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
