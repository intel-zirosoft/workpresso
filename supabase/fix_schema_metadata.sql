-- [Pod B] 일정 관리 기능 복구 및 고도화를 위한 스키마 보정 SQL
-- 이 SQL을 Supabase SQL Editor에서 실행해 주세요.

-- 1. 누락된 컬럼 추가 (has_voice, metadata)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'has_voice') THEN
        ALTER TABLE schedules ADD COLUMN has_voice BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'metadata') THEN
        ALTER TABLE schedules ADD COLUMN metadata JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. (선택) 기존 데이터 마이그레이션 - 제목에 포함된 요약본을 metadata로 이동 (v1.0 호환)
-- 주의: 이미 metadata를 사용 중인 데이터는 무시합니다.
UPDATE schedules 
SET 
  metadata = jsonb_build_array(
    jsonb_build_object(
      'sub_id', 'migrated_' || id,
      'content', split_part(title, '---', 2),
      'tags', ARRAY['이전 데이터']
    )
  ),
  title = trim(split_part(title, '---', 1))
WHERE 
  title LIKE '%---%' 
  AND (metadata IS NULL OR jsonb_array_length(metadata) = 0);
