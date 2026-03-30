# Pod A: Documents System (결재 및 문서 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod A의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 📌 현재 구현 현황 (2026-03-27)

- 문서 워크플로우 v2의 **주요 코드 구현은 완료**되었습니다.
- 완료 범위:
  - 다단계 결재선 / 공람(CC) 데이터 구조 추가
  - `GET /api/documents?scope=&status=`, `GET /api/documents/[id]`, `POST /api/documents/[id]/submit`, `POST /api/documents/[id]/approval` 포함 API 개편
  - 읽기 우선 상세 모달, 대형 편집 오버레이, 편집 버튼 진입 플로우 구현
  - Markdown 툴바/단축키, `Tab` 들여쓰기, 제목 단계 단축키, `Ctrl/Cmd+Shift+V` 미리보기 토글 구현
  - 멀티 스텝 편집기(템플릿 선택 → 본문 작성 → 결재선/공람) 및 집중 보기(`크게보기`) 오버레이 구현
  - `내 문서 Grid`, `내 결재함`, `공람 문서` 분리 UI 및 탐색 컨테이너 내부 스크롤 구현
  - Pod A unit test 갱신 및 통과
- 남은 확인:
  - Supabase에 신규 마이그레이션 실제 적용 전 integration 기준 검증 필요
  - 수동 QA 미완료
  - 전체 `type-check`는 Pod A가 아닌 `apps/web/src/app/api/chat/route.ts` 기존 오류 때문에 아직 실패

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

- [x] **DB/Schema**: 문서의 결재 상태(Draft, Pending, Approved, Rejected 등) 변경에 대한 상태값(Enum 등) 정의
- [x] **Backend (API)**: 결재 상태 업데이트를 위한 PATCH API 엔드포인트 구현
- [x] **Frontend (UI)**: 결재함(Inbox) 목록 UI 및 상태 변경 버튼 구현 (파스텔 톤, `rounded-pill` 스타일 적용)
- [x] **Frontend (State)**: TanStack Query를 활용한 결재 상태 낙관적 업데이트(Optimistic Update) 구현
- [x] **Integration (Edge Function)**: 문서가 '승인(APPROVED)' 상태로 변경 시 트리거되는 Supabase Edge Function 작성
- [x] **Integration (Pod C)**: 위 Edge Function에서 Pod C(AI 지식 벡터)의 RAG 인덱싱 프로세스를 호출하도록 연동

## 🧑‍💻 Part 3: 다단계 결재 데이터 모델

**목표:** 단일 상태 변경 구조를 다단계 직렬 결재와 공람이 가능한 워크플로우 구조로 확장

- [x] **DB/Schema**: `documents`에 제출 시점, 최종 승인 시점 등 워크플로우 관리 필드 확장
- [x] **DB/Schema**: `document_approval_steps` 테이블 설계 (`document_id`, `step_order`, `step_label`, `approver_id`, `status`, `acted_at`)
- [x] **DB/Schema**: `document_cc_recipients` 테이블 설계 (`document_id`, `recipient_id`)
- [x] **DB/Schema**: 단계 상태값 `WAITING`, `PENDING`, `APPROVED`, `REJECTED` 정의 및 타입 연동
- [x] **Validation**: 결재선 순서 중복, 최소 1개 이상 단계 존재, approver 중복 정책, CC 중복 제거 규칙 정리
- [x] **Security**: 작성자/결재자/공람자 기준 문서 열람 범위와 문서 수정 범위 문서화
- [ ] **Migration Apply**: 신규 Supabase 마이그레이션을 실제 환경에 적용하고 반영 여부 확인

## 🧑‍💻 Part 4: 결재 워크플로우 API

**목표:** 다단계 결재선, 공람, 제출, 승인/반려 액션을 처리하는 서버 계약 확정

- [x] **Backend (API)**: `GET /api/documents?scope=&status=` 목록 조회 규격 추가 (`authored`, `approvals`, `cc`)
- [x] **Backend (API)**: `GET /api/documents/[id]` 상세 조회 API 추가
- [x] **Backend (API)**: `POST /api/documents` payload를 제목/본문 + 결재선 + CC 포함 구조로 확장
- [x] **Backend (API)**: `PATCH /api/documents/[id]` 수정 API에 결재선/CC 재구성 로직 반영
- [x] **Backend (API)**: `POST /api/documents/[id]/submit` 제출 API 구현
- [x] **Backend (API)**: `POST /api/documents/[id]/approval` 승인/반려 액션 API 구현
- [x] **Authorization**: 현재 `PENDING` 단계의 approver만 승인/반려 가능하도록 검증
- [x] **Workflow Engine**: 단계 승인 시 다음 단계 활성화, 최종 단계 승인 시 문서 `APPROVED` 전환
- [x] **Integration (Pod C)**: 최종 승인 시 Pod C knowledge sync 호출, 재오픈 시 stale index 정리 정책 반영

## 🧑‍💻 Part 5: 문서 편집 경험 개선

**목표:** 읽기 우선 상세 모달과 비개발자 친화적인 Markdown 입력 경험 제공

- [x] **Frontend (UI)**: 문서 선택 시 읽기 전용 상세를 모달 오버레이로 노출
- [x] **Frontend (UI)**: 작성자 전용 `편집` 버튼으로만 수정 모드에 진입하도록 플로우 수정
- [x] **Frontend (Permission)**: `DRAFT`/`REJECTED`만 편집 가능, `PENDING`/`APPROVED`는 읽기 전용으로 고정
- [x] **Frontend (UI)**: textarea 상단 Markdown 툴바 추가 (`B`, `I`, `링크`, `불릿`, `번호`, `인용`)
- [x] **Frontend (UX)**: 선택 영역 기준 Markdown 삽입 유틸리티 구현
- [x] **Frontend (UX)**: `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Ctrl/Cmd+K` 단축키 지원
- [x] **Frontend (UX)**: `Tab` 키 입력 시 현재 줄 또는 선택 줄에 들여쓰기 적용
- [x] **Frontend (UX)**: `Ctrl/Cmd+]`, `Ctrl/Cmd+[` 단축키로 제목 단계 1레벨씩 증가/감소 처리
- [x] **Frontend (UI)**: 멀티 스텝 편집기 구성 (`템플릿 선택 → 제목/본문 → 결재선/공람`)
- [x] **Frontend (UI)**: 템플릿 프리셋 (`일반 결재 문서`, `지출 결의서`, `프로젝트 승인 요청서`, `구매 요청서`, `업무 보고 및 승인서`, `건너뛰기`) 적용
- [x] **Frontend (UI)**: 미리보기는 상시 노출 대신 토글형으로 전환하고 `Ctrl/Cmd+Shift+V` 단축키 연결
- [x] **Frontend (UX)**: 편집/미리보기를 유지한 채 같은 다이얼로그 안에서 `크게보기` 집중 모드 제공
- [x] **Frontend (UX)**: 본문 textarea auto-resize를 적용해 이중 스크롤을 줄이고 오버레이 본문 기준 단일 스크롤 구조로 정리
- [x] **Frontend (Detail)**: 상세 뷰에 결재 타임라인, 현재 단계, CC 목록, 상태 배지 노출

## 🧑‍💻 Part 6: 문서 목록 / 인박스 UI

**목표:** 문서 작성자 관점과 결재자/공람자 관점을 분리한 탐색 경험 제공

- [x] **Frontend (UI)**: `내 문서 Grid` 구현 (데스크톱 표형 레이아웃, 모바일 카드 폴백)
- [x] **Frontend (UI)**: `내 결재함` 구현 (내가 현재 결재해야 하는 문서만 표시)
- [x] **Frontend (UI)**: `공람 문서` 구현 (CC 지정으로 열람 가능한 문서만 표시)
- [x] **Frontend (UI)**: `문서 분류`와 `결재 분류` 필터를 좌우 구획형 레이아웃으로 재구성
- [x] **Frontend (UX)**: 문서 탐색 목록이 길어질 때 페이지 전체가 아니라 탐색 컨테이너 내부에서 스크롤되도록 조정
- [x] **Frontend (State)**: scope, status, selected document 기준 TanStack Query 캐시 전략 재정의
- [x] **Frontend (UX)**: 목록에서 문서 선택 시 읽기 전용 상세 모달 동기화
- [x] **Security**: 권한 없는 문서가 목록/상세 어디에도 노출되지 않도록 API 응답과 UI 상태 정합성 검증

## 🧑‍💻 Part 7: 테스트 및 문서 동기화

**목표:** 새 워크플로우 구조를 타입/권한/상태 전이 기준으로 검증하고 협업 문서와 동기화

- [x] **Schema Test**: `DocumentSummary`, `DocumentDetail`, `ApprovalStep`, `CcRecipient` Zod 스키마 테스트 추가
- [ ] **API Test**: 제출 시 1단계만 `PENDING`으로 활성화되는지 검증
- [ ] **API Test**: 활성 단계 approver만 승인/반려 가능한지 권한 위반 케이스 검증
- [ ] **API Test**: 중간 단계 반려 시 문서 `REJECTED` 전환과 재편집 가능 상태 검증
- [ ] **API Test**: 마지막 단계 승인 시 문서 `APPROVED` 전환과 Pod C Edge Function 호출 1회 검증
- [ ] **UI Test / Manual QA**: 상세 모달 읽기 모드, 편집 버튼, Markdown 툴바/단축키 동작 점검
- [ ] **UI Test / Manual QA**: `Tab` 들여쓰기와 `Ctrl/Cmd+]`, `Ctrl/Cmd+[` 제목 단계 단축키 동작 점검
- [ ] **UI Test / Manual QA**: `내 문서 Grid`, `내 결재함`, `공람 문서` scope별 노출 검증
- [ ] **UI Test / Manual QA**: 멀티 스텝 편집기 전환, 템플릿 적용, 미리보기 토글, `크게보기` 집중 모드 동작 점검
- [ ] **UI Test / Manual QA**: textarea auto-resize와 오버레이 단일 스크롤 동작 점검
- [ ] **Docs Sync**: API 변경 시 `docs/api/Workpresso_API_명세서.md`와 관련 협업 문서 동기화
- [ ] **Dependency Log**: 신규 라이브러리 도입 시 `docs/operations/DEPENDENCIES.md` 즉시 업데이트
- [x] **Unit Test**: `npm test` 기준 Pod A 관련 unit test 통과
- [ ] **Type Check**: 전체 `npm run type-check` 통과
  현재는 `apps/web/src/app/api/chat/route.ts` 기존 타입 오류로 실패 중
