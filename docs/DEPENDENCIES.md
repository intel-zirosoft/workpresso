# Project Dependencies Manifesto
<!-- 프로젝트 의존성 관리 명세서 -->

This file tracks all libraries added during development to ensure team-wide synchronization and prevent duplicate installations.
<!-- 이 파일은 팀 간 동기화를 보장하고 중복 설치를 방지하기 위해 개발 중 추가된 모든 라이브러리를 추적합니다. -->

| Library | Version | Pod | Purpose | Date |
| :--- | :--- | :--- | :--- | :--- |
| `lucide-react` | latest | Common | Shared icon set for UI consistency | 2024-03-23 |
| `zod` | latest | Common | Full-stack schema validation | 2024-03-23 |
| `react-markdown` | latest | Pod A | Markdown rendering for documents | 2024-03-23 |
| `class-variance-authority` | latest | Common | shadcn/ui variant typing for shared button and calendar components | 2026-03-25 |
| `supabase` | ^2.84.0 | Common | Supabase CLI for local type generation and project management | 2026-03-25 |
| `@radix-ui/react-dropdown-menu` | latest | Common | UI Dropdown for Header Auth | 2026-03-25 |

---
*Note: The Agent must update this table whenever `npm install` or `bun add` is executed.*
<!-- *참고: 에이전트는 `npm install` 또는 `bun add`가 실행될 때마다 이 표를 업데이트해야 합니다.* -->
