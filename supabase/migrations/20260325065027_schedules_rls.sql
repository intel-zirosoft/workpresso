-- schedules 테이블에 대한 RLS 활성화
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 1. 조회: 본인의 일정만 볼 수 있음
CREATE POLICY "Users can view their own schedules"
ON schedules FOR SELECT
USING (auth.uid() = user_id);

-- 2. 생성: 본인의 일정만 생성할 수 있음
CREATE POLICY "Users can insert their own schedules"
ON schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. 수정: 본인의 일정만 수정할 수 있음
CREATE POLICY "Users can update their own schedules"
ON schedules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. 삭제: 본인의 일정만 삭제할 수 있음
CREATE POLICY "Users can delete their own schedules"
ON schedules FOR DELETE
USING (auth.uid() = user_id);
