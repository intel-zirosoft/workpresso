-- 1. ENUM 타입 추가 (존재하지 않을 때만)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.USER_ROLE AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'TEAM_ADMIN', 'USER');
    END IF;
END $$;

-- 2. teams 테이블 신설
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 트리거 함수 체크 및 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'public.teams'::regclass) THEN
        CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 3. users 테이블 스키마 변경 (가장 안전한 IF NOT EXISTS 방식)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role public.USER_ROLE DEFAULT 'USER'::public.USER_ROLE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- 4. RLS 권한 활성화 (순서 중요: 컬럼 추가 후 실행)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teams_select_all ON public.teams;
CREATE POLICY teams_select_all ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS teams_insert_admin ON public.teams;
CREATE POLICY teams_insert_admin ON public.teams FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('SUPER_ADMIN', 'ORG_ADMIN'))
);

DROP POLICY IF EXISTS teams_update_admin ON public.teams;
CREATE POLICY teams_update_admin ON public.teams FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('SUPER_ADMIN', 'ORG_ADMIN'))
);

-- 5. API 접근 권한 부여
GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 6. 첫 가입자 무조건 SUPER_ADMIN 부여 트리거 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
    assigned_role public.USER_ROLE;
BEGIN
    -- users 테이블에 유저가 한 명도 없는지 체크
    SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;
    
    IF is_first_user THEN
        assigned_role := 'SUPER_ADMIN'::public.USER_ROLE;
    ELSE
        assigned_role := 'USER'::public.USER_ROLE;
    END IF;

    INSERT INTO public.users (id, name, department, status, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New User'),
        COALESCE(new.raw_user_meta_data->>'department', 'Unassigned'),
        'ACTIVE'::public.USER_STATUS,
        assigned_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
