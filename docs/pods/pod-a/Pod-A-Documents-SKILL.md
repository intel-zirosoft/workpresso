# Pod A: Documents System Skill (Workflow v2)
<!-- Pod A: 결재 및 문서 시스템 스킬 (워크플로우 v2) -->

## 🎯 Domain Scope & Tech Stack
<!-- 🎯 도메인 범위 및 기술 스택 -->
- **Primary Path**: `apps/web/src/features/pod-a/` (Core logic & UI)
- **Routes / APIs**: `apps/web/src/app/(docs)/documents/`, `apps/web/src/app/api/documents/`
- **Framework**: Next.js (App Router) / **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions) / **State**: TanStack Query
- **Source of Truth**: `packages/db/schema.db`
- **Specialized Libs**: `react-markdown`, `remark-gfm`, `@tailwindcss/typography`

## 🧭 Current Baseline & v2 Goal
<!-- 🧭 현재 기준선 및 v2 목표 -->
- **Current Baseline**: The existing implementation is centered on a single `documents` table, author-owned CRUD, and direct status changes from the workspace.
- **Workflow v2 Goal**: Expand the document system into a multi-step approval workflow with CC visibility, read-first detail screens, Markdown GUI helpers, and a personal document history grid.
- **Default Approval Policy**: Provide 3 default step labels (`팀장 -> 부서장 -> 대표`) while keeping the DB/API shape extensible for additional sequential steps later.
- **User Selection Policy**: Because the current `users` table has no role or title field, approvers and CC recipients must be chosen manually from user records at document creation/edit time.

## 🚧 Implementation Status
<!-- 🚧 현재 구현 상태 -->
- **Implemented in Code**: Workflow v2 UI, document detail/read-only flow, submit/approval APIs, approval step + CC schema/types, Markdown toolbar, keyboard shortcuts, and scope-based document lists are implemented in the web app codebase.
- **Migration Pending**: The DB schema and Supabase migration file are updated, but actual migration application and environment verification must still be completed per environment.
- **Verification Status**: Pod A unit tests pass with `npm test`.
- **Known Blocker**: Full repository `type-check` is still blocked by pre-existing errors in `apps/web/src/app/api/chat/route.ts`, not by the Pod A document changes.

## 🧱 Data Model Contract
<!-- 🧱 데이터 모델 규약 -->
- **`documents`**: Stores the document body, author, overall workflow status, and submission/final approval timestamps.
- **`document_approval_steps`**: Stores one row per approval step with `step_order`, `step_label`, `approver_id`, `status`, `acted_at`, and optional rejection comment metadata.
- **`document_cc_recipients`**: Stores CC recipients who can read the document but cannot approve or reject it.
- **Document Status**: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`
- **Approval Step Status**: `WAITING`, `PENDING`, `APPROVED`, `REJECTED`
- **Recommended Ownership Rule**: `documents` remains the aggregate root; approval steps and CC rows must be inserted, updated, and queried by `document_id`.

## 🔄 Workflow Rules
<!-- 🔄 워크플로우 규칙 -->
- **Draft Save**: A document starts as `DRAFT` and stores editable title/content plus configured approval steps and CC recipients.
- **Submit**: Submitting a draft changes the document to `PENDING`, marks only the first approval step as `PENDING`, and leaves later steps as `WAITING`.
- **Sequential Approval**: Only the currently active approver may approve or reject. On approval, the next step becomes `PENDING`.
- **Final Approval**: When the last step is approved, the document becomes `APPROVED` and triggers Pod C knowledge sync.
- **Rejection**: If any active approver rejects, the document becomes `REJECTED`, the current step becomes `REJECTED`, and remaining waiting steps stay inactive until the author edits and resubmits.
- **Resubmission Rule**: Authors may revise `REJECTED` documents and submit again, resetting step states according to the updated approval line.

## 🖥️ UX / UI Rules
<!-- 🖥️ UX / UI 규칙 -->
- **Read-First Detail View**: Opening a document detail must default to read-only mode.
- **Edit Permission**: Only the author may enter edit mode, and only while the document is `DRAFT` or `REJECTED`.
- **Locked States**: `PENDING` and `APPROVED` documents are read-only in the editor form.
- **Explicit Edit Flow**: Use an `편집` button to toggle edit mode rather than opening detail screens in a mutable state.
- **Markdown GUI**: Keep the textarea-based editor, but add a toolbar that inserts Markdown for `굵게`, `기울임`, `링크`, `불릿 목록`, `번호 목록`, `인용문`.
- **Keyboard Shortcuts**: Support `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, and `Ctrl/Cmd+K` for common Markdown actions.
- **Indentation Rule**: Pressing `Tab` in the textarea should insert indentation for the current line or selected lines instead of moving browser focus.
- **Heading Level Shortcuts**: Support `Ctrl/Cmd+]` to increase the heading depth by one level and `Ctrl/Cmd+[` to decrease it by one level, based on the current line's Markdown heading prefix.
- **List Surfaces**: Separate `내 문서 Grid`, `내 결재함`, and `공람 문서`.
- **History Grid Rule**: The first version of the document grid should focus on the logged-in author's own documents. Desktop uses a table/grid-like layout; mobile falls back to cards.
- **Detail Metadata**: The selected document view should show approval timeline, current active step, CC recipients, and current document status.

## 🔐 Security & Access Rules
<!-- 🔐 보안 및 접근 규칙 -->
- **Read Access**: Only the author, current/past/future approvers in the workflow, and CC recipients may read document details.
- **Write Access**: Only the author may edit document content, and only in `DRAFT` or `REJECTED`.
- **Approval Access**: Only the user assigned to the active `PENDING` step may approve or reject.
- **Scope Queries**: API list responses should distinguish authored documents, actionable approval inbox items, and CC-visible documents without leaking unrelated records.
- **Knowledge Sync Rule**: Pod C indexing should be created or refreshed only after final approval. Before that point, the system may remove stale indexed data if the workflow reopens.

## 🔌 Interfaces (Public API / Types)
<!-- 🔌 인터페이스 (공개 API / 타입) -->
- **List API**: `GET /api/documents?scope=&status=` where `scope` supports at least `authored`, `approvals`, `cc`
- **Detail API**: `GET /api/documents/[id]`
- **Create API**: `POST /api/documents`
- **Edit API**: `PATCH /api/documents/[id]`
- **Submit API**: `POST /api/documents/[id]/submit`
- **Approval Action API**: `POST /api/documents/[id]/approval`
- **Create / Update Payloads**: Must include title, content, ordered approval steps, and CC recipients.
- **Approval Action Payload**: Must distinguish at least `APPROVE` vs `REJECT`, with optional rejection note if the UI provides it.
- **Public Response Types**:
  - `DocumentSummary`
  - `DocumentDetail`
  - `ApprovalStep`
  - `CcRecipient`
  - `ApprovalAction`
  - `ApprovalStepStatus = WAITING | PENDING | APPROVED | REJECTED`

## 🤝 Full-stack Pairing Workflow (2-Person)
<!-- 🤝 2인 풀스택 협업 워크플로우 -->
- **Vertical Slicing**: Each member owns an end-to-end workflow slice rather than only UI or only API.
  - **Member 1**: Document authoring experience (draft CRUD, edit mode toggle, Markdown toolbar, document history grid)
  - **Member 2**: Approval workflow engine (approval step schema, submit/approve/reject APIs, inbox scopes, CC visibility, Pod C sync)
- **Shared Contract First**: Define the Zod schemas and API payload contracts before parallel implementation.
- **Integration Point**: Treat `DocumentDetail` as the shared contract between authoring UI and approval inbox UI.

## 📜 Source of Truth & AI Protocol
<!-- 📜 데이터 표준 및 AI 코딩 규약 -->
- **Mandatory Schema Reference**: Always check `packages/db/schema.db` before making any data-related change.
- **Migration Discipline**: Any new table, enum, or column required by workflow v2 must be reflected first in the DB schema and then in Supabase migrations.
- **AI Vibe Coding Guidance**: When using AI tools, provide the current DB schema and the `DocumentDetail` contract to avoid invented fields.

## 📦 Library Management Protocol
<!-- 📦 라이브러리 관리 규약 -->
- **Update Required**: Whenever a new library is installed, the agent MUST update `docs/operations/DEPENDENCIES.md` immediately with the library name, version, and exact Pod A purpose.
- **Bias Toward Existing Stack**: Prefer implementing the Markdown GUI on top of the current textarea and shadcn/ui controls before introducing a new rich-text editor dependency.

## 📋 Definition of Done
<!-- 📋 완료 조건 -->
- Can an author save a draft with 3 approval steps and CC recipients, reopen it, and see the same workflow configuration?
- On submit, does only the first step become `PENDING` while later steps remain `WAITING`?
- Can only the active approver execute approve/reject actions?
- Does rejection return the document to an author-revisable state without unlocking unrelated users?
- Does the document detail screen open in read-only mode and require an explicit edit action?
- Do toolbar buttons and keyboard shortcuts insert valid Markdown into the textarea?
- Does `Tab` indent the current line or selected lines without breaking textarea editing flow?
- Do `Ctrl/Cmd+]` and `Ctrl/Cmd+[` increase or decrease heading levels one step at a time?
- Are `내 문서 Grid`, `내 결재함`, and `공람 문서` separated by permission-aware queries?
- Does final approval trigger Pod C knowledge sync exactly once for the completed workflow state?
