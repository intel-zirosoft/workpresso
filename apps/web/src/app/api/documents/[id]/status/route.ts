import { NextResponse } from "next/server";

import {
  createDocumentResponseSchema,
  normalizeDocumentRow,
  updateDocumentStatusInputSchema,
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

async function syncDocumentKnowledge(document: {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/document-knowledge-sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        action: document.status === "APPROVED" ? "upsert" : "remove",
        document,
        documentId: document.id,
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ?? "문서 지식 인덱싱 Edge Function 호출에 실패했습니다."
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsedInput = updateDocumentStatusInputSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        message: "문서 상태 입력값이 올바르지 않습니다.",
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

  const { data, error } = await adminSupabase
    .from("documents")
    .update({
      status: parsedInput.data.status,
    })
    .eq("id", params.id)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .select(documentSelectColumns)
    .single();

  if (error) {
    return NextResponse.json(
      { message: "문서 상태를 변경하지 못했습니다." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "상태를 변경할 문서를 찾지 못했습니다." },
      { status: 404 }
    );
  }

  const document = normalizeDocumentRow(data);

  try {
    await syncDocumentKnowledge(document);
  } catch (syncError) {
    console.error("document-knowledge-sync failed:", syncError);
  }

  return NextResponse.json(
    createDocumentResponseSchema.parse({
      document,
    })
  );
}
