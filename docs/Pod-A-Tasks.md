# Pod A: Documents System (결재 및 문서 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod A의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 📌 현재 구현 현황 (2026-03-30)

- 문서 워크플로우 v2의 **주요 코드 구현은 완료**되었습니다.
- 완료 범위:
  - 다단계 결재선 / 공람(CC) 데이터 구조 추가
  - `GET /api/documents?scope=&status=`, `GET /api/documents/[id]`, `POST /api/documents/[id]/submit`, `POST /api/documents/[id]/approval` 포함 API 개편
  - 읽기 우선 상세 모달, 대형 편집 오버레이, 편집 버튼 진입 플로우 구현
  - Markdown 툴바/단축키, `Tab` 들여쓰기, 제목 단계 단축키, `Ctrl/Cmd+Shift+V` 미리보기 토글 구현
  - 멀티 스텝 편집기(템플릿 선택 → 본문 작성 → 결재선/공람) 및 집중 보기(`크게보기`) 오버레이 구현
  - `내 문서 Grid`, `내 결재함`, `공람 문서` 분리 UI 및 탐색 컨테이너 내부 스크롤 구현
  - 문서 제출 / 승인 / 반려 시 Slack 상태 알림 연동 구현
  - 승인 완료 문서의 Jira 이슈 생성, 링크 저장, 상태 위젯 연동 구현
  - `프로젝트 승인 요청서` 템플릿의 Jira 추출 친화 섹션(`기능 명세`, `작업 체크리스트`) 보강
  - Pod A unit test 19건 및 `apps/web` 기준 `npm run type-check` 통과
- 남은 확인:
  - Supabase에 신규 마이그레이션 실제 적용 전 integration 기준 검증 필요
  - 수동 QA 미완료
  - Slack 양방향 승인(Slack App/Bot 기반)과 Jira 부분 실패 요약 반환은 후속 확장 범위

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
- [x] **Docs Sync**: API 변경 시 `docs/Workpresso_API_명세서.md`와 관련 협업 문서 동기화
- [ ] **Dependency Log**: 신규 라이브러리 도입 시 `docs/DEPENDENCIES.md` 즉시 업데이트
- [x] **Unit Test**: `npm test` 기준 Pod A 관련 unit test 통과
- [x] **Type Check**: `apps/web` 기준 `npm run type-check` 통과

## 🧭 Jira / Slack 연동 기반 Pod A 실행 계획

본 계획은 `docs/Slack, Jira API Integration roadmap.md`의 Pod A 로드맵을 현재 구현 상태에 맞게 실제 작업 단위로 내린 실행안입니다.

### 현재 기반 자산

- [x] **문서 워크플로우 API**: `submit`, `approval`, 상태 전이, 다단계 결재선이 이미 구현되어 있음
- [x] **외부 연동 설정 저장소**: `workspace_extensions` 기반 Slack/Jira 설정 저장 및 활성화 구조가 있음
- [x] **Jira 단건 생성 유틸**: `createJiraIssue` 서버 액션이 있어 단건 티켓 생성 베이스를 재사용할 수 있음
- [ ] **Slack 양방향 승인 인프라**: 현재는 Webhook 중심이며, Block Kit 인터랙션 처리용 Slack App/Bot 인프라는 아직 없음
- [x] **문서-외부 이슈 매핑 저장소**: `document_jira_links` 기반 문서별 Jira 이슈 링크/상태 저장 구조 추가

### Phase 1. Slack 알림 파이프라인 구축

**목표:** Pod A 문서 상태 변화를 Slack으로 안정적으로 전달하는 최소 기능을 먼저 완성

- [x] **Backend (Integration)**: 문서 `submit`, `approve`, `reject` 시점에 호출할 Slack 알림 서비스 계층 추가
- [x] **Payload Design**: `DRAFT → PENDING`, `PENDING → APPROVED`, `PENDING → REJECTED`를 현재 도메인 상태값 기준으로 메시지 템플릿화
- [x] **Settings Reuse**: 기존 `workspace_extensions.ext_name = 'slack'` 설정을 재사용하도록 연결
- [ ] **Frontend (UX)**: 문서 상세 또는 편집 완료 후 Slack 발송 성공/실패 토스트 처리
- [x] **Fallback Policy**: Slack 발송 실패가 문서 제출/결재 자체를 막지 않도록 비동기 후처리 또는 soft-fail 정책 정의
- [x] **Docs Sync**: Slack 알림 트리거 규칙을 `docs/Workpresso_API_명세서.md` 또는 운영 문서에 반영

### Phase 2. Slack 리모트 승인 확장

**목표:** Slack 메시지 안에서 `승인` / `반려`를 눌러 Pod A 결재 액션을 완료

- [x] **Settings Schema**: 1차는 기존 Webhook + Slack Interactivity 조합으로 진행하고, Bot Token / Signing Secret은 후속 확장으로 분리
- [x] **Backend (API)**: Slack 인터랙션 콜백 엔드포인트 추가
- [ ] **Authorization**: Slack 액션 수행자가 현재 `PENDING` 단계 approver인지 기존 Pod A 권한 규칙으로 재검증
- [x] **Workflow Bridge**: Slack 버튼 액션이 기존 `POST /api/documents/[id]/approval` 로직과 동일한 워크플로우 엔진을 재사용하도록 연결
- [x] **Idempotency**: 이미 처리된 문서/단계에 대한 중복 승인 요청은 기존 Pod A 권한/상태 검증으로 거절
- [ ] **Comment Flow**: 반려 사유 입력 UX는 1차에서는 고정 사유 또는 링크 이동으로 단순화하고, 자유 입력은 후속 확장으로 분리
- [ ] **QA**: Slack에서 승인, 반려, 권한 없음, 만료 액션 시나리오 수동 검증

### Phase 3. Jira 기획-실행 브릿지

**목표:** Pod A 문서를 기준으로 Jira 이슈를 생성하고 문서 안에서 진행 상태를 추적

- [x] **DB/Schema**: 문서와 Jira 이슈를 연결하는 `document_jira_links` 성격의 매핑 저장소 추가
- [x] **Backend (Parser)**: PRD 본문에서 기능 명세표 또는 체크리스트를 추출하는 최소 규칙 정의
- [x] **Backend (Integration)**: 기존 `createJiraIssue`를 확장해 Epic/Story 타입 분기와 다건 생성 orchestration 추가
- [ ] **Error Handling**: 일부 이슈만 생성 실패한 경우 성공/실패 결과를 문서 단위로 요약 반환
- [x] **Frontend (UI)**: 문서 상세에 Jira 생성 실행 버튼과 생성 결과 요약 영역 추가
- [x] **Frontend (UI)**: 연결된 Jira 이슈 키, 상태, 담당자, 링크를 보여주는 라이브 위젯 영역 추가
- [x] **Sync Strategy**: 문서 상세 조회 시 Jira 상태를 on-demand 조회하는 1차 전략 적용
- [x] **Docs Sync**: PRD 템플릿에서 Jira 자동 생성이 가능한 최소 작성 규칙을 문서화

### Phase 4. 문서 멘션 및 알림 정교화

**목표:** 단순 상태 알림을 넘어 실제 협업 응답 속도를 높이는 세부 기능 확장

- [ ] **DB/Schema**: WorkPresso 사용자와 Slack 사용자 식별자 매핑 저장 방식 정의
- [ ] **Backend (Parser)**: 문서 본문 코멘트/멘션 이벤트 추출 규칙 정의
- [ ] **Slack Delivery**: 문서 멘션 시 채널 알림이 아닌 대상자 중심 알림 또는 DM 발송 전략 추가
- [ ] **Notification Policy**: 동일 문서에서 과도한 중복 알림이 발생하지 않도록 디바운스/묶음 정책 정의

### 권장 구현 순서

1. **Phase 1**: 현재 자산 재사용 폭이 가장 크고, 사용자 체감이 빠른 Slack 상태 알림부터 적용
2. **Phase 2**: Slack App 인프라를 추가해 결재 승인 버튼까지 확장
3. **Phase 3**: Jira 대량 생성과 라이브 위젯으로 PRD-실행 연결 완성
4. **Phase 4**: 멘션/DM 최적화로 협업 속도 개선

### 선행 확인 사항

- [x] Slack 1차 스코프는 Webhook + Interactivity 기준으로 진행하고, Bot Token / Signing Secret은 후속 보강 대상으로 분리
- [ ] Jira 자동 생성 대상 문서 템플릿(PRD 한정 여부) 확정
- [ ] Epic/Story 생성 규칙과 기본 Jira 프로젝트 키 사용 정책 확정
- [ ] 문서별 Jira 상태 동기화를 실시간 조회 중심으로 갈지, 저장형 캐시를 둘지 확정
