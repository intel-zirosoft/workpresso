import { NextResponse } from "next/server";

import { userListResponseSchema } from "@/features/pod-a/services/document-schema";
import { listDocumentUsers } from "@/features/pod-a/services/document-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "사용자 목록을 확인하려면 로그인이 필요합니다." },
    { status: 401 },
  );
}

export async function GET() {
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
    const users = await listDocumentUsers(adminSupabase);

    return NextResponse.json(
      userListResponseSchema.parse({
        users,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "사용자 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
