import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDatabase() {
  console.log('🔍 DB 지식 데이터 정밀 진단 중...');
  try {
    // 1. 전체 데이터 개수 확인
    const { count, error: countError } = await supabase
      .from('knowledge_vectors')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`📊 전체 지식 데이터 개수: ${count}개`);

    // 2. '복리후생' 키워드가 포함된 데이터 검색
    const { data, error: searchError } = await supabase
      .from('knowledge_vectors')
      .select('id, metadata')
      .limit(10); // 전체 목록을 보고 판단

    if (searchError) throw searchError;

    const welfareData = data?.filter(item => 
      JSON.stringify(item.metadata).includes('복리후생') || 
      JSON.stringify(item.metadata).includes('복지')
    );

    if (welfareData && welfareData.length > 0) {
      console.log('✅ "복리후생" 관련 데이터를 찾았습니다:');
      welfareData.forEach((d, i) => {
        console.log(`\n[데이터 ${i+1}] ID: ${d.id}`);
        console.log(`내용 요약: ${JSON.stringify(d.metadata).substring(0, 200)}...`);
      });
    } else {
      console.log('❌ "복리후생" 또는 "복지" 키워드가 포함된 데이터를 찾지 못했습니다.');
      console.log('💡 원인 가능성: 동기화는 되었으나 검색 가능한 텍스트가 metadata에 없거나, 파일 내용에 해당 단어가 없을 수 있습니다.');
    }

  } catch (error: any) {
    console.error('❌ 진단 실패:', error.message);
  }
}

checkDatabase();
