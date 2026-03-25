# Pod A: Documents System (결재 및 문서 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod A의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 마크다운 에디터 및 문서 CRUD

**목표:** 문서 작성 및 조회를 위한 핵심 인프라와 UI 구축

- [x] **DB/Schema**: `packages/db/schema.db`의 `documents` 테이블 스키마 확인 및 Zod 스키마 정의
- [x] **Backend (API)**: 새 문서 생성을 위한 POST API 엔드포인트 구현 (Supabase Insert)
- [x] **Backend (API)**: 작성된 문서를 조회하는 GET API 구현
- [x] **Frontend (UI)**: 마크다운 에디터 컴포넌트 구현 (`react-markdown`, `@tailwindcss/typography`의 `prose` 클래스 활용)
- [x] **Frontend (State)**: TanStack Query를 활용한 폼 상태 관리 및 API 연동
- [x] **Validation**: Zod를 활용한 마크다운 본문 크기 및 `author_id` 무결성 검증 로직 추가
- [x] **Security**: Supabase RLS를 적용하여 사용자가 본인의 문서만 조회/수정할 수 있도록 제한

## 🧑‍💻 Part 2: 결재 워크플로우 및 상태 관리

**목표:** 작성된 문서의 결재 상태 변경 및 승인 이후의 후속 처리 로직 구축

- [ ] **DB/Schema**: 문서의 결재 상태(Draft, Pending, Approved, Rejected 등) 변경에 대한 상태값(Enum 등) 정의
- [ ] **Backend (API)**: 결재 상태 업데이트를 위한 PATCH API 엔드포인트 구현
- [ ] **Frontend (UI)**: 결재함(Inbox) 목록 UI 및 상태 변경 버튼 구현 (파스텔 톤, `rounded-pill` 스타일 적용)
- [ ] **Frontend (State)**: TanStack Query를 활용한 결재 상태 낙관적 업데이트(Optimistic Update) 구현
- [ ] **Integration (Edge Function)**: 문서가 '승인(APPROVED)' 상태로 변경 시 트리거되는 Supabase Edge Function 작성
- [ ] **Integration (Pod C)**: 위 Edge Function에서 Pod C(AI 지식 벡터)의 RAG 인덱싱 프로세스를 호출하도록 연동
