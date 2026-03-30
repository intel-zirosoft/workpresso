DO $$
BEGIN
  ALTER TYPE public.SOURCE_TYPE ADD VALUE IF NOT EXISTS 'SCHEDULES';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_vectors_source_type_source_id_idx
ON public.knowledge_vectors (source_type, source_id);
