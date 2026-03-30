import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 서비스 롤 클라이언트 초기화 (인덱싱은 RLS를 우회가 필요한 경우가 많으므로 관리자 권한 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Pod C: Knowledge AI Component Integration Interface
 * 이 서비스는 타 파드에서 변환된 텍스트를 수신하여 벡터 인덱싱을 수행하는 진입점입니다.
 */
export const indexKnowledge = async (sourceId: string, sourceType: 'DOCUMENTS' | 'MEETING_LOGS', text: string, metadata: any = {}) => {
  try {
    console.log(`[Pod C] Indexing starting for ${sourceType}: ${sourceId}`);

    // 1. OpenAI 임베딩 생성 (text-embedding-3-small 가성비 및 성능 우수)
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    const [{ embedding }] = embeddingResponse.data;

    // 2. DB에 동기화 (Upsert: 원본 ID-타입 조합 기준 중복 방지)
    const { data, error } = await supabaseAdmin
      .from('knowledge_vectors')
      .upsert({
        source_type: sourceType,
        source_id: sourceId,
        embedding,
        metadata: {
          ...metadata,
          indexed_at: new Date().toISOString(),
          word_count: text.split(/\s+/).length
        }
      }, { onConflict: 'source_type, source_id' }) // 유니크 제약 조건 기반 upsert (스키마 확인 필요)
      .select();

    if (error) throw error;

    console.log(`[Pod C] Successfully indexed knowledge: ${sourceId}`);
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error(`[Pod C Error] Knowledge Indexing failed:`, error);
    // 인덱싱 실패가 전체 비즈니스 로직을 중단시키지 않도록 에러를 흡수하되 상태만 반환
    return { success: false, error };
  }
};
