# Settings (설정) 기능 기술 명세서 및 구현 계획안

본 문서는 WorkPresso의 통합 설정(Settings) 메뉴 개발을 위해 즉시 코딩이 가능한 수준으로 작성된 기술 명세서입니다.

---

## 1. 아키텍처 및 권한 계층 설계

설정 메뉴는 시스템의 민감한 정보를 다루므로 철저한 권한 분리가 필수적입니다.
권한은 다음 4단계 계층으로 구성됩니다.

1. **`SUPER_ADMIN` (개발사 슈퍼관리자)**: 시스템 전역 LLM 연동 키 설정 등 백오피스 관리.
2. **`ORG_ADMIN` (고객사 최상위 관리자)**: 워크스페이스 내 모든 팀/사용자 권한 관리, 공통 외부 서비스(Slack, Jira 등) 연동 관리.
3. **`TEAM_ADMIN` (팀 관리자)**: 소속 팀의 멤버 관리.
4. **`USER` (일반 사용자)**: 자신의 프로필 정보 등 제한적 조회/수정만 허용.

---

## 2. DB 스키마 마이그레이션 계획

`packages/db/schema.db` 업데이트 및 `supabase/migrations/` 폴더에 생성될 새로운 마이그레이션 파일(`..._add_settings_and_roles.sql`) 내용입니다.

### 2.1. ENUM 타입 추가
```sql
CREATE TYPE USER_ROLE AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'TEAM_ADMIN', 'USER');
```

### 2.2. `teams` 테이블 신설
```sql
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- update_updated_at_column 트리거 적용 필요
CREATE TRIGGER set_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3. `users` 테이블 스키마 변경
기존 `department` 컬럼을 유지하되(`NULL` 허용), `team_id`와 `role`을 도입합니다.
```sql
ALTER TABLE users 
ADD COLUMN role USER_ROLE DEFAULT 'USER'::USER_ROLE,
ADD COLUMN team_id UUID REFERENCES teams(id);

-- (옵션) 기존 department 기반으로 초기 team 데이터 마이그레이션 진행
```

### 2.4. `workspace_extensions` 테이블 활용 방안
설정 정보 저장을 위해 기존 테이블을 그대로 활용합니다.
- **시스템 LLM**: `ext_name = 'system_llm'`, `config = { "provider": "openai", "api_key": "sk-..." }` (접근: `SUPER_ADMIN`)
- **Slack 연동**: `ext_name = 'slack'`, `config = { "webhook_url": "..." }` (접근: `ORG_ADMIN`)
- **Jira 연동**: `ext_name = 'jira'`, `config = { "project_key": "...", "api_token": "..." }` (접근: `ORG_ADMIN`)

---

## 3. 프론트엔드 라우트 및 폴더 구조 (Next.js App Router)

### 3.1. 라우트 설계 (`apps/web/src/app/(settings)/`)
```text
app/
└── (settings)/
    ├── layout.tsx         # 설정 페이지 전용 2Depth LNB (사이드바) 배치
    └── settings/
        ├── page.tsx       # /settings -> /settings/profile 로 리다이렉트
        ├── profile/       # (공통) 내 프로필 설정
        ├── team/          # (TEAM_ADMIN 이상) 내 팀원 관리
        ├── organization/  # (ORG_ADMIN 이상) 전체 팀/사용자 권한 관리
        ├── integrations/  # (ORG_ADMIN 이상) Slack/Jira 연동 설정
        └── system/        # (SUPER_ADMIN 전용) 시스템 LLM 등 코어 설정
```

### 3.2. 도메인 로직 설계 (`apps/web/src/features/settings/`)
`features` 폴더 하위에 `settings` 도메인을 구축하여 비즈니스 로직을 캡슐화합니다.

```text
features/settings/
├── components/
│   ├── SettingsSidebar.tsx    # 권한(role)을 Props로 받아 동적으로 메뉴 항목 노출
│   ├── UserRoleBadge.tsx      # 상태 색상이 적용된 뱃지 (예: SUPER_ADMIN은 빨간색)
│   ├── TeamManagementTable.tsx # 조직 및 권한 수정 테이블 (Radix UI, React Hook Form 연동)
│   └── APIKeyForm.tsx         # LLM/Slack 등 API Key 입력 및 마스킹 처리 폼
├── hooks/
│   ├── useSettings.ts         # 현재 접속 유저의 권한 정보 및 설정 데이터를 불러오는 훅
│   └── ...
└── services/
    ├── userAction.ts          # Server Action: updateUserRole, assignUserToTeam
    ├── teamAction.ts          # Server Action: createTeam, updateTeam
    └── extensionAction.ts     # Server Action: upsertExtensionConfig, toggleExtension
```

---

## 4. 권한 제어 (RBAC) 및 보안 구현

### 4.1. Server/Middleware 접근 제어
1. **Next.js Middleware (`apps/web/src/middleware.ts`)**:
   - `/settings/system` 경로 접근 시 Supabase Auth의 유저 세션을 확인하여 `role !== 'SUPER_ADMIN'` 이면 `/settings/profile`로 리다이렉트 (403 처리).
   - `/settings/organization`, `/settings/integrations` 등도 각각의 권한 조건으로 검사 추가.

2. **Server Actions (`features/settings/services/`)**:
   - 액션 실행 전 반드시 `const user = await getUser();`를 호출하고 권한을 체크합니다. (클라이언트에서 버튼이 노출되더라도 백엔드 방어벽 구현)

### 4.2. Supabase RLS (Row Level Security) 정책
`packages/db/schema.db` 또는 마이그레이션 파일에 다음 RLS 정책을 추가합니다.
- **`teams` 테이블**: 누구나 SELECT 가능. INSERT/UPDATE는 `ORG_ADMIN`, `SUPER_ADMIN`만 가능.
- **`users` 테이블**: 누구나 전체 유저 SELECT 가능. UPDATE(`role`, `team_id`)는 `ORG_ADMIN`, `SUPER_ADMIN`만 가능 (자기 자신의 프로필 변경은 별도 허용).

---

## 5. 단계별 개발 가이드 (실행 순서)

1. **DB 작업 (백엔드)**: `schema.db` 수정 및 `supabase migration new add_settings_and_roles` 명령어를 통해 마이그레이션 스크립트를 생성하고 위 SQL을 작성합니다.
2. **타입 적용 (공통)**: `supabase gen types`를 실행하여 갱신된 스키마 타입을 클라이언트에 반영합니다.
3. **API & Server Actions (백엔드)**: `features/settings/services/` 내부의 로직들을 구현합니다.
4. **UI 컴포넌트 개발 (프론트엔드)**: `docs/assets/design_theme.txt`를 준수하여 Sidebar, Form, Table 등 개별 컴포넌트를 구축합니다.
5. **라우트 연결 및 미들웨어 (풀스택)**: `app/(settings)` 경로에 페이지들을 연결하고, `middleware.ts`에 권한 제어 로직을 추가하여 마무리지습니다.

**[승인 대기]** 이 기술 명세서를 바탕으로 실제 개발 작업을 시작할 수 있습니다. 피드백이 완료되었다면 Plan Mode를 종료해 주세요.