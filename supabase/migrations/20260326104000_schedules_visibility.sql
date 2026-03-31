-- 1. USER_STATUS Enum 확장 (기존 타입에 값 추가)
-- PostgreSQL에서 ENUM에 값을 추가하는 방식
ALTER TYPE USER_STATUS ADD VALUE IF NOT EXISTS 'REMOTE';
ALTER TYPE USER_STATUS ADD VALUE IF NOT EXISTS 'OUTSIDE';
ALTER TYPE USER_STATUS ADD VALUE IF NOT EXISTS 'HALF_DAY';

-- 2. SCHEDULE_TYPE Enum 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE SCHEDULE_TYPE AS ENUM ('TASK', 'MEETING', 'VACATION', 'WFH', 'OUTSIDE', 'HALF_DAY');
    END IF;
END $$;

-- 3. schedules 테이블에 type 컬럼 추가
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS type SCHEDULE_TYPE DEFAULT 'TASK';

-- 4. RLS 정책 업데이트 (전체 조회 허용)
-- 기존의 엄격한 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;

-- 새로운 정책: 모든 인증된 사용자는 모든 일정을 최신순으로 조회 가능
CREATE POLICY "Users can view all schedules"
ON schedules FOR SELECT
TO authenticated
USING (true);

-- 수정/삭제/생성은 여전히 본인만 가능 (기존 정책 유지 또는 재확인)
DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
CREATE POLICY "Users can insert their own schedules" 
ON schedules FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
CREATE POLICY "Users can update their own schedules" 
ON schedules FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedules" ON schedules;
CREATE POLICY "Users can delete their own schedules" 
ON schedules FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
