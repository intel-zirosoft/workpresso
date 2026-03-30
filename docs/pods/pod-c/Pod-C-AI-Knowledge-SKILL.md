# Pod C: AI & Knowledge Vector Skill (Full-stack Vertical Slicing)
<!-- Pod C: AI 에이전틱 및 지식 벡터 스킬 (풀스택 수직적 분할 버전) -->

## 🎯 Domain Scope & Tech Stack
<!-- 🎯 도메인 범위 및 기술 스택 -->
- **Primary Path**: `apps/web/src/features/pod-c/` (Core logic & UI)
<!-- - **핵심 경로**: `apps/web/src/features/pod-c/` (핵심 로직 및 UI) -->
- **Framework**: Next.js (App Router) / **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database with `pgvector`, Edge Functions)
- **Data Model**: `knowledge_vectors` table in `packages/db/schema.db`
- **Specialized Libs**: `Vercel AI SDK`, `openai-edge` (for streaming AI response)

## 🤝 Full-stack Pairing Workflow (2-Person)
<!-- 🤝 2인 풀스택 협업 워크플로우 -->
- **Vertical Slicing**: Divide domain into small full-stack features.
<!-- - **수직적 분할**: 도메인을 작은 단위의 풀스택 기능으로 쪼갬. -->
  - **Member 1**: Chat UI & Streaming API (Chat Interface + Edge Function + Streaming logic)
  <!-- - **팀원 1**: 채팅 UI 및 스트리밍 API (채팅 인터페이스 + 에지 함수 + 스트리밍 로직) -->
  - **Member 2**: Vector Ingestion & Function Calling (RAG Pipeline + Function Calling logic + Search API)
  <!-- - **팀원 2**: 벡터 적재 및 펑션 콜링 (RAG 파이프라인 + 펑션 콜링 로직 + 검색 API) -->
- **Collaboration**: Coordinate with Pod B on the exact JSON payload for schedule creation via Function Calling.
<!-- - **협업**: 펑션 콜링을 통한 일정 생성을 위해 파드 B와 정확한 JSON 페이로드를 협의할 것. -->

## 🛠 Data Integrity & Security
<!-- 🛠 데이터 무결성 및 보안 -->
- **Vector Standard**: Ensure consistent use of `text-embedding-3-small` (1536 dim) across all embeddings.
<!-- - **벡터 표준**: 모든 임베딩에서 text-embedding-3-small(1536 dim)을 일관되게 사용할 것. -->
- **Security**: Never expose API keys in client-side code; use Supabase Edge Functions for all AI interactions.
<!-- - **보안**: 클라이언트 사이드 코드에 API 키를 노출하지 말 것; 모든 AI 인터랙션은 Supabase 에지 함수를 사용할 것. -->

## 📜 Source of Truth & AI Protocol
<!-- 📜 데이터 표준 및 AI 코딩 규약 -->
- **Mandatory Schema Reference**: Always refer to `packages/db/schema.db` before any data-related coding to ensure field name and type consistency.
<!-- - **스키마 참조 필수**: 필드명 및 타입 일관성을 위해 모든 데이터 관련 코딩 전 반드시 `packages/db/schema.db`를 참조할 것. -->
- **AI Vibe Coding Guidance**: When using AI (Cursor, Gemini, etc.), explicitly provide the `schema.db` context to prevent hallucination of database structures.
<!-- - **AI 바이브 코딩 가이드**: AI를 활용할 경우, 데이터베이스 구조에 대한 환각(Hallucination)을 방지하기 위해 반드시 `schema.db` 컨텍스트를 제공할 것. -->

## 📦 Library Management Protocol
<!-- 📦 라이브러리 관리 규약 -->
- **Update Required**: Whenever a new library is installed, the agent MUST update `docs/operations/DEPENDENCIES.md` immediately with the library name, version, and specific purpose for Pod C.
<!-- - **업데이트 필수**: 새로운 라이브러리 설치 시, 에이전트는 반드시 즉시 `docs/operations/DEPENDENCIES.md`를 업데이트해야 하며, 라이브러리명, 버전 및 파드 C에서의 구체적인 용도를 기록할 것. -->

## 🔌 Interfaces (External Integration)
<!-- 🔌 인터페이스 (외부 연동 규격) -->
- **System Control**: Implement Function Calling that triggers APIs from Pod B (Schedules).
<!-- - **시스템 제어**: 파드 B(일정)의 API를 호출하는 펑션 콜링을 구현할 것. -->

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
- Does the chatbot provide streaming responses with a loading spinner?
<!-- - 챗봇이 로딩 애니메이션과 함께 스트리밍 응답을 제공하는가? -->
- Can the AI correctly interpret a 'schedule' intention and call the Pod B API?
<!-- - AI가 '일정' 의도를 정확히 파악하고 파드 B의 API를 호출하는가? -->
