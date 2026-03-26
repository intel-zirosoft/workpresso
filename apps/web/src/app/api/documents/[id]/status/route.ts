import { NextResponse } from "next/server";

export async function PATCH(
  _request?: Request,
  _context?: { params: { id: string } },
) {
  return NextResponse.json(
    {
      message:
        "직접 상태 변경 API는 더 이상 지원되지 않습니다. /submit 또는 /approval 엔드포인트를 사용해 주세요.",
    },
    { status: 410 },
  );
}
