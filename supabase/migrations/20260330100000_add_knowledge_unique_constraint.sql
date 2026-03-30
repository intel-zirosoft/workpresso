-- knowledge_vectors 테이블 데이터 중복 정리 후 유니크 제약 조건 추가
WITH ranked_vectors AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY source_type, source_id
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) AS row_number
    FROM public.knowledge_vectors
)
DELETE FROM public.knowledge_vectors
WHERE id IN (
    SELECT id
    FROM ranked_vectors
    WHERE row_number > 1
);

ALTER TABLE public.knowledge_vectors
ADD CONSTRAINT knowledge_vectors_source_unique UNIQUE (source_type, source_id);
