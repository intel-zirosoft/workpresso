# Pod B: Schedules System Skill (Full-stack Vertical Slicing)
<!-- Pod B: 업무 및 일정 시스템 스킬 (풀스택 수직적 분할 버전) -->

## 🎯 Domain Scope & Tech Stack
<!-- 🎯 도메인 범위 및 기술 스택 -->
- **Primary Path**: `apps/web/src/features/pod-b/` (Core logic & UI)
<!-- - **핵심 경로**: `apps/web/src/features/pod-b/` (핵심 로직 및 UI) -->
- **Framework**: Next.js (App Router) / **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database) / **State**: TanStack Query
- **Data Model**: `schedules` table in `packages/db/schema.db`
- **Specialized Libs**: `react-day-picker` (via shadcn/ui), `date-fns` (for timezone logic)

## 🤝 Full-stack Pairing Workflow (2-Person)
<!-- 🤝 2인 풀스택 협업 워크플로우 -->
- **Vertical Slicing**: Divide domain into small full-stack features.
<!-- - **수직적 분할**: 도메인을 작은 단위의 풀스택 기능으로 쪼갬. -->
  - **Member 1**: Calendar View & Schedule CRUD (DB Select/Insert + API + Calendar UI)
  <!-- - **팀원 1**: 캘린더 뷰 및 일정 CRUD (DB 조회/저장 + API + 캘린더 UI) -->
  - **Member 2**: Attendance/Kanban UI & Integration (Status Update + API + Kanban UI)
  <!-- - **팀원 2**: 근태 상태/칸반 UI 및 연동 (상태 업데이트 + API + 칸반 UI) -->
- **Collaboration**: Establish common Tailwind color palette for different status colors.
<!-- - **협업**: 상태별 색상 일관성을 위해 공통 Tailwind 컬러 팔레트를 정의할 것. -->

## 🛠 Data Integrity & Security
<!-- 🛠 데이터 무결성 및 보안 -->
- **RLS Policy**: Strict policy ensuring users can only view/edit their own schedules.
<!-- - **RLS 정책**: 사용자가 본인의 일정만 조회/수정할 수 있도록 엄격한 정책 적용. -->
- **Timezone**: Ensure all timestamps are handled as `UTC` on the server and local timezone on the client.
<!-- - **Timezone**: 서버에서는 모든 타임스탬프를 UTC로, 클라이언트에서는 로컬 시간대로 처리할 것. -->

## 📜 Source of Truth & AI Protocol
<!-- 📜 데이터 표준 및 AI 코딩 규약 -->
- **Mandatory Schema Reference**: Always refer to `packages/db/schema.db` before any data-related coding to ensure field name and type consistency.
<!-- - **스키마 참조 필수**: 필드명 및 타입 일관성을 위해 모든 데이터 관련 코딩 전 반드시 `packages/db/schema.db`를 참조할 것. -->
- **AI Vibe Coding Guidance**: When using AI (Cursor, Gemini, etc.), explicitly provide the `schema.db` context to prevent hallucination of database structures.
<!-- - **AI 바이브 코딩 가이드**: AI를 활용할 경우, 데이터베이스 구조에 대한 환각(Hallucination)을 방지하기 위해 반드시 `schema.db` 컨텍스트를 제공할 것. -->

## 📦 Library Management Protocol
<!-- 📦 라이브러리 관리 규약 -->
- **Update Required**: Whenever a new library is installed, the agent MUST update `docs/DEPENDENCIES.md` immediately with the library name, version, and specific purpose for Pod B.
<!-- - **업데이트 필수**: 새로운 라이브러리 설치 시, 에이전트는 반드시 즉시 `docs/DEPENDENCIES.md`를 업데이트해야 하며, 라이브러리명, 버전 및 파드 B에서의 구체적인 용도를 기록할 것. -->

## 🔌 Interfaces (External Integration)
<!-- 🔌 인터페이스 (외부 연동 규격) -->
- **API Access**: Provide clean POST endpoints for Pod C (AI Agent) to register schedules on behalf of users.
<!-- - **API 접근**: 파드 C(AI 에이전트)가 유저를 대신해 일정을 등록할 수 있도록 깨끗한 POST 엔드포인트 제공. -->

## 🎨 Design Theme Adherence (Soft & Trustworthy)
<!-- 🎨 디자인 테마 준수 (부드러움 및 신뢰감) -->
- **Visual Style**: Use pastel tones, organic shapes, and generous border radii (`rounded-md` for cards, `rounded-pill` for buttons).
<!-- - **시각적 스타일**: 파스텔 톤, 유기적인 형태, 넉넉한 테두리 반경(카드 `rounded-md`, 버튼 `rounded-pill`)을 사용할 것. -->
- **Shadows**: Prefer soft, primary-tinted shadows (`shadow-soft`) over borders to separate space.
<!-- - **그림자**: 공간 구분을 위해 테두리 대신 부드럽고 푸른 틴트가 들어간 그림자(`shadow-soft`)를 우선 사용할 것. -->
- **Typography**: Apply `font-headings` (Fredoka) for titles and `font-body` (Nunito) for readability.
<!-- - **타이포그래피**: 제목에는 `font-headings`(Fredoka)를, 가독성이 필요한 본문에는 `font-body`(Nunito)를 적용할 것. -->

## 📋 Definition of Done
<!-- 📋 완료 조건 -->
- Are schedules rendered correctly in the calendar according to the user's timezone?
<!-- - 사용자의 시간대에 따라 일정이 캘린더에 정확히 렌더링되는가? -->
- Can Member 2's Kanban UI interact with Member 1's API without issues?
<!-- - 팀원 2의 칸반 UI가 팀원 1의 API와 문제없이 연동되는가? -->
