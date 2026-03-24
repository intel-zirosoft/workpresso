# Pod A: Documents System Skill (Full-stack Vertical Slicing)
<!-- Pod A: 결재 및 문서 시스템 스킬 (풀스택 수직적 분할 버전) -->

## 🎯 Domain Scope & Tech Stack
<!-- 🎯 도메인 범위 및 기술 스택 -->
- **Primary Path**: `apps/web/src/features/pod-a/` (Core logic & UI)
<!-- - **핵심 경로**: `apps/web/src/features/pod-a/` (핵심 로직 및 UI) -->
- **Framework**: Next.js (App Router) / **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database) / **State**: TanStack Query
- **Data Model**: `documents` table in `packages/db/schema.db`
- **Specialized Libs**: `react-markdown`, `@tailwindcss/typography` (for editor styling)

## 🤝 Full-stack Pairing Workflow (2-Person)
<!-- 🤝 2인 풀스택 협업 워크플로우 -->
- **Vertical Slicing**: Each member owns a feature from DB to UI.
<!-- - **수직적 분할**: 각 팀원이 DB부터 UI까지 하나의 기능을 온전히 책임짐. -->
  - **Member 1**: Markdown Editor & Document CRUD (DB Insert + POST API + Editor UI)
  <!-- - **팀원 1**: 마크다운 에디터 및 문서 CRUD (DB 저장 + POST API + 에디터 UI) -->
  - **Member 2**: Approval Flow & Status Management (DB Update + PATCH API + Inbox UI)
  <!-- - **팀원 2**: 결재 워크플로우 및 상태 관리 (DB 업데이트 + PATCH API + 결재함 UI) -->
- **Collaboration**: Define Zod schemas first to share data structures between Client & Server.
<!-- - **협업**: 클라이언트와 서버 간 데이터 구조 공유를 위해 Zod 스키마를 먼저 정의할 것. -->

## 🛠 Data Integrity & Security
<!-- 🛠 데이터 무결성 및 보안 -->
- **Row Level Security (RLS)**: Use Supabase RLS to ensure users only access their own documents.
<!-- - **RLS**: Supabase RLS를 사용하여 사용자가 본인의 문서에만 접근할 수 있도록 보장함. -->
- **Validation**: Use `Zod` to validate Markdown content size and `author_id` consistency.
<!-- - **검증**: Zod를 사용하여 마크다운 본문 크기 및 작성자 ID 일관성을 검증함. -->

## 📜 Source of Truth & AI Protocol
<!-- 📜 데이터 표준 및 AI 코딩 규약 -->
- **Mandatory Schema Reference**: Always refer to `packages/db/schema.db` before any data-related coding to ensure field name and type consistency.
<!-- - **스키마 참조 필수**: 필드명 및 타입 일관성을 위해 모든 데이터 관련 코딩 전 반드시 `packages/db/schema.db`를 참조할 것. -->
- **AI Vibe Coding Guidance**: When using AI (Cursor, Gemini, etc.), explicitly provide the `schema.db` context to prevent hallucination of database structures.
<!-- - **AI 바이브 코딩 가이드**: AI를 활용할 경우, 데이터베이스 구조에 대한 환각(Hallucination)을 방지하기 위해 반드시 `schema.db` 컨텍스트를 제공할 것. -->

## 📦 Library Management Protocol
<!-- 📦 라이브러리 관리 규약 -->
- **Update Required**: Whenever a new library is installed, the agent MUST update `docs/DEPENDENCIES.md` immediately with the library name, version, and specific purpose for Pod A.
<!-- - **업데이트 필수**: 새로운 라이브러리 설치 시, 에이전트는 반드시 즉시 `docs/DEPENDENCIES.md`를 업데이트해야 하며, 라이브러리명, 버전 및 파드 A에서의 구체적인 용도를 기록할 것. -->

## 🔌 Interfaces (External Integration)
<!-- 🔌 인터페이스 (외부 연동 규격) -->
- **Edge Functions**: Trigger Pod C's RAG indexing when a document is `APPROVED`.
<!-- - **Edge Functions**: 문서가 '승인' 상태가 되면 파드 C의 RAG 인덱싱을 트리거함. -->

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
- Is the document rendered correctly with Tailwind Typography (`prose`)?
<!-- - Tailwind Typography(prose)를 통해 문서가 정상적으로 렌더링되는가? -->
- Does the full-stack flow (UI -> API -> Supabase) work without type errors?
<!-- - UI부터 DB까지 이어지는 풀스택 흐름이 타입 에러 없이 작동하는가? -->
