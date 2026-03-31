import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearDatabase() {
  console.log('🧹 DB 지식 데이터 초기화 중...');

  try {
    const { error } = await supabase
      .from('knowledge_vectors')
      .delete()
      .neq('source_type', 'DUMMY'); // 전체 삭제

    if (error) throw error;
    console.log('✅ 모든 지식 데이터가 삭제되었습니다.');
  } catch (error: any) {
    console.error('❌ 삭제 실패:', error.message);
  }
}

clearDatabase();
