-- [Pod B] 일정 테이블 스키마 보정 (v1.0 호환성 확보)
-- schedules 테이블에 누락된 has_voice, metadata 컬럼을 추가합니다.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'has_voice') THEN
        ALTER TABLE schedules ADD COLUMN has_voice BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'metadata') THEN
        ALTER TABLE schedules ADD COLUMN metadata JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
