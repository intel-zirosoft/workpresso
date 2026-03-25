-- 1. 벡터 익스텐션 활성화 (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. SOURCE_TYPE ENUM 타입 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
        CREATE TYPE public.SOURCE_TYPE AS ENUM ('DOCUMENTS', 'MEETING_LOGS');
    END IF;
END $$;

-- 3. knowledge_vectors 테이블 생성
CREATE TABLE IF NOT EXISTS public.knowledge_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type public.SOURCE_TYPE NOT NULL,
    source_id UUID NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small/large 대응
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS knowledge_vectors_embedding_idx 
ON public.knowledge_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. 벡터 유사도 검색 RPC 함수 생성
CREATE OR REPLACE FUNCTION public.match_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  source_type public.SOURCE_TYPE,
  source_id UUID,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kv.id,
    kv.source_type,
    kv.source_id,
    kv.metadata,
    1 - (kv.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_vectors kv
  WHERE 1 - (kv.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
