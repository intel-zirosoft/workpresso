import {
  type KnowledgeSourceType,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";

/**
 * Pod C: Knowledge AI Component Integration Interface
 * 이 서비스는 타 파드에서 변환된 텍스트를 수신하여 벡터 인덱싱을 수행하는 진입점입니다.
 */
export const indexKnowledge = async (
  sourceId: string,
  sourceType: KnowledgeSourceType,
  text: string,
  metadata: Record<string, unknown> = {},
) => {
  try {
    console.log(`[Pod C] Indexing starting for ${sourceType}: ${sourceId}`);

    await upsertKnowledgeSource({
      sourceType,
      sourceId,
      title: typeof metadata.title === "string" ? metadata.title : null,
      content: text,
      metadata: {
        ...metadata,
        indexed_at: new Date().toISOString(),
        word_count: text.split(/\s+/).filter(Boolean).length,
      },
    });

    console.log(`[Pod C] Successfully indexed knowledge: ${sourceId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Pod C Error] Knowledge Indexing failed:`, error);
    // 인덱싱 실패가 전체 비즈니스 로직을 중단시키지 않도록 에러를 흡수하되 상태만 반환
    return { success: false, error };
  }
};
