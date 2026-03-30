-- knowledge_vectors 테이블 데이터 중복 방지를 위한 유니크 제약 조건 추가
ALTER TABLE public.knowledge_vectors 
ADD CONSTRAINT knowledge_vectors_source_unique UNIQUE (source_type, source_id);
