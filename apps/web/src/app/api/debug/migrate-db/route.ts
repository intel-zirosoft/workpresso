import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // schedules 테이블에 누락된 컬럼 추가 (has_voice, metadata)
    // Supabase-js는 직접 ALTER TABLE을 지원하지 않으므로 RPC를 호출해야 함.
    // 만약 exec_sql RPC가 없다면 직접적인 생성은 어려울 수 있음.
    
    // 하지만 이 환경에서는 대안으로 기존의 sync 로직에서 컬럼이 없으면 에러가 나므로,
    // 우선 컬럼 존재 여부를 확인하는 대신 직접 수동으로 보정하는 SQL을 준비함.
    
    // IMPORTANT: 이 프로젝트의 Supabase 설정에 따라 RPC 권한이 다를 수 있음.
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'has_voice') THEN
                ALTER TABLE schedules ADD COLUMN has_voice BOOLEAN DEFAULT false;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'metadata') THEN
                ALTER TABLE schedules ADD COLUMN metadata JSONB DEFAULT '[]'::jsonb;
            END IF;
        END $$;
      `
    });

    if (error) {
       console.error("Migration via RPC failed:", error);
       return NextResponse.json({ 
         success: false, 
         error: error.message,
         tip: "콘솔에서 직접 SQL을 실행하거나 supabase db push가 필요할 수 있습니다." 
       });
    }

    return NextResponse.json({ success: true, message: "Schema updated successfully via RPC." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
