# WorkPresso Pod A-D 테스트 케이스

작성일: 2026-03-27

## 1. 기준 문서

- `docs/Pod-A-Tasks.md`
- `docs/Pod-B-Tasks.md`
- `docs/Pod-C-Tasks.md`
- `docs/Pod-D-Tasks.md`
- `docs/Workpresso_API_명세서.md`
- `docs/DB설계서_최종본.md`
- `docs/KANBAN-DONE-LOG.md`
- `docs/daily_report_20260324.md`
- `docs/meeting_minutes_20260324.md`
- 보조 확인: `docs/pod-c-openai.json`

## 2. 작성 원칙

- 본 문서는 "현재까지 문서로 확인 가능한 요구사항과 진행 상태"를 기준으로 작성한 테스트 케이스 설계 문서입니다.
- `명세 기반`은 문서에 직접 근거가 있는 케이스입니다.
- `추론 기반`은 테스트 가능성을 위해 최소한의 합리적 가정을 둔 케이스입니다.
- `모호/충돌`은 명세 불충분 또는 문서 간 불일치로 인해 테스트 고정 전에 확인이 필요한 항목입니다.

## 3. 현재 커버리지 요약

| Pod | 현재 구현 상태 요약 | 우선 테스트 수준 | 현재 기준 메모 |
| --- | --- | --- | --- |
| A | 워크플로우 v2 주요 코드 완료, unit test 통과, 수동 QA와 Supabase 실적용 검증 미완료 | Integration, UI/Manual QA | 문서상 가장 구체적이며 즉시 테스트 설계 가능 |
| B | 일정 CRUD, 타임존 처리, 근태 칸반, 자동 상태 동기화 구현 완료 | API Integration, UI/Manual QA | PATCH 계약과 상태 복귀 규칙이 문서상 부족 |
| C | 스트리밍 응답, 벡터 적재, RAG 검색 구현 완료. 채팅 UI와 일정 Function Calling은 미완료 | Contract Test, Integration, E2E | Pod B 연동 payload 미확정 |
| D | 녹음, 업로드, STT, 히스토리, AI 정제, Pod C 인덱싱 연동까지 구현 완료 | Integration, E2E, UI/Manual QA | API/DB 문서가 구현 진도를 충분히 따라오지 못함 |

## 4. 현재 확인된 자동화 단서

- Pod A는 아래 파일 기준으로 자동화 흔적이 확인됩니다.
- `apps/web/src/app/api/documents/documents-routes.test.ts`
- `apps/web/src/app/api/documents/documents-routes.integration.test.ts`
- `apps/web/src/features/pod-a/components/document-editor.test.ts`
- `apps/web/src/features/pod-a/services/document-schema.test.ts`
- `apps/web/src/features/pod-a/services/document-api.test.ts`
- Pod C는 전체 서비스 수준의 Playwright 시나리오가 확인됩니다.
- `apps/web/tests/full-service.spec.ts`
- Pod B, Pod D는 문서 및 파일 검색 기준 별도 전용 테스트 파일을 확인하지 못했습니다.

## 5. 공통 리스크 및 명세 공백

- Pod B는 작업 문서상 일정 CRUD에 `PATCH`가 포함되지만 통합 API 문서에는 `GET`, `POST`, `DELETE`만 있어 계약 보완이 필요합니다.
- Pod C는 RAG 검색 API가 작업 문서에는 있으나 통합 API 문서에는 `/api/chat`, `/api/admin/sync-knowledge`만 있어 테스트 대상 API를 먼저 확정해야 합니다.
- Pod C의 Pod B Function Calling payload는 작업 문서상 아직 협의 중이므로 자동화 테스트를 바로 고정하면 회귀 비용이 큽니다.
- Pod D는 히스토리 목록, Signed URL, 정제 결과 스키마, 단계별 상태 응답이 API 문서에 부족합니다.
- Pod D Roadmap의 확장 컬럼과 `docs/DB설계서_최종본.md`의 `meeting_logs` 필드가 일치하지 않아 DB 기준 테스트를 먼저 확정해야 합니다.
- Pod A는 신규 마이그레이션 실제 적용 전 검증과 전체 `type-check`가 남아 있으므로 CI 기준 최종 합격선은 아직 닫히지 않았습니다.

## 6. Pod A 테스트 케이스

### 6.1 커버리지 요약

- 문서 생성, 수정, 제출, 승인/반려, 목록 scope, 상세 권한, Markdown 편집 UX까지 명세가 구체적입니다.
- 현재 가장 높은 우선순위는 상태 전이, 권한, Pod C 연동, 오버레이 UI 수동 QA입니다.

### 6.2 우선 보완이 필요한 항목

- 제출 시 1단계만 `PENDING`으로 활성화되는지에 대한 통합 검증
- 현재 단계 approver 외 사용자의 승인/반려 차단 검증
- 마지막 승인 시 Pod C sync 1회 호출 및 재오픈 시 stale index 처리 검증
- 읽기 모달, 멀티 스텝 편집기, Markdown 단축키 수동 QA

### 6.3 테스트 케이스 매트릭스

| ID | 근거 | 규칙 유형 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-01 | 명세 기반 | happy path | 작성자가 초안 문서를 생성한다 | 로그인 사용자와 동일한 `authorId`, 유효한 제목/본문/결재선/공람자 준비 | `POST /api/documents` 호출 | `201`, 문서 상태 `DRAFT`, 결재 단계/공람자 정보 포함 반환 | 결재선 0개면 거절되어야 함 | Integration |
| A-02 | 명세 기반 | validation rule | 로그인 사용자와 다른 `authorId`로 생성 시도를 막는다 | 로그인 사용자 A, body의 `authorId`는 사용자 B | `POST /api/documents` 호출 | 권한 오류 또는 검증 오류 반환, 데이터 미생성 | `authorId` 누락 또는 형식 오류도 동일 계열로 거절 | Integration |
| A-03 | 명세 기반 | validation rule | 결재선 approver 중복과 CC 중복을 막는다 | 동일 approver 또는 동일 CC가 중복된 payload 준비 | 생성 또는 수정 호출 | 중복 정책 위반 오류 반환 | 결재선 순서 중복도 함께 거절 | Unit + Integration |
| A-04 | 명세 기반 | permission rule | 목록 조회가 `authored`, `approvals`, `cc` scope에 맞게 분리된다 | 작성 문서, 현재 결재 문서, 공람 문서를 각각 준비 | `GET /api/documents?scope=...` 호출 | 각 scope에 해당하는 문서만 노출 | 권한 없는 문서는 어떤 scope에서도 노출되면 안 됨 | Integration |
| A-05 | 명세 기반 | permission rule | 상세 조회가 작성자/현재 결재자/공람자에게만 허용된다 | 문서와 관련 없는 사용자 포함 4종 사용자 준비 | `GET /api/documents/[id]` 호출 | 관련 사용자만 상세와 권한 정보를 받는다 | 비권한 사용자는 403/404 계열로 차단 | Integration |
| A-06 | 명세 기반 | state transition | 초안 또는 반려 문서를 제출하면 문서가 결재 대기로 전환된다 | `DRAFT` 또는 `REJECTED` 문서와 3단계 결재선 준비 | `POST /api/documents/[id]/submit` 호출 | 문서 상태 `PENDING`, 1단계 `PENDING`, 나머지 `WAITING` | 이미 `PENDING`/`APPROVED`인 문서는 제출 불가 | Integration |
| A-07 | 명세 기반 | permission rule | 현재 `PENDING` 단계 approver만 승인 또는 반려할 수 있다 | 1단계 approver, 2단계 approver, 작성자 준비 | `POST /api/documents/[id]/approval` 호출 | 현재 단계 approver만 성공, 나머지는 거절 | 공람자와 unrelated 사용자도 모두 거절 | Integration |
| A-08 | 명세 기반 | state transition | 중간 단계 승인 시 다음 단계가 활성화된다 | `PENDING` 문서와 3단계 결재선 준비 | 1단계 approver가 `APPROVE` 수행 | 1단계 `APPROVED`, 2단계 `PENDING`, 문서는 계속 `PENDING` | 이미 처리된 단계에 대한 재승인 요청은 거절 | Integration |
| A-09 | 명세 기반 | state transition | 마지막 단계 승인 시 문서가 최종 승인된다 | 마지막 단계만 `PENDING`인 문서 준비 | 마지막 approver가 `APPROVE` 수행 | 문서 상태 `APPROVED`, `finalApprovedAt` 설정 | 승인 후 추가 수정/재제출은 차단 | Integration |
| A-10 | 명세 기반 | state transition | 중간 또는 마지막 단계에서 반려되면 문서가 반려 상태가 된다 | `PENDING` 문서 준비 | approver가 `REJECT` 수행 | 문서 상태 `REJECTED`, 작성자 `canEdit=true` | 반려 코멘트 저장 누락 여부 확인 | Integration |
| A-11 | 명세 기반 | permission rule | `DRAFT`와 `REJECTED`만 편집 가능하고 `PENDING`/`APPROVED`는 읽기 전용이다 | 상태별 문서 4종 준비 | 상세 모달 진입 후 편집 시도 | 허용 상태에서만 편집 버튼/수정 API 가능 | UI가 편집 버튼을 숨겨도 API 우회 수정은 막아야 함 | Integration + UI |
| A-12 | 명세 기반 | side effect | 최종 승인 시 Pod C knowledge sync가 발생한다 | 마지막 승인 직전 상태 문서 준비, Pod C 연동 mock 구성 | 최종 승인 수행 | Pod C sync 호출 1회 기록 | 네트워크 재시도로 중복 호출되면 안 됨 | Integration |
| A-13 | 명세 기반 | regression risk | 읽기 전용 상세는 모달 오버레이로 열리고, 수정은 작성자 전용 편집 버튼으로만 진입한다 | 작성자와 비작성자 각각 준비 | 문서 선택 후 상세 확인 | 페이지 인라인 편집이 아닌 읽기 모달 표시, 작성자만 편집 진입 가능 | 비작성자가 URL/DOM 조작으로 편집 진입하면 안 됨 | E2E + Manual QA |
| A-14 | 명세 기반 | regression risk | Markdown 툴바와 단축키가 본문 입력을 올바르게 변환한다 | 편집 오버레이에서 본문 입력값 준비 | `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Ctrl/Cmd+K`, `Tab`, `Ctrl/Cmd+]`, `Ctrl/Cmd+[` 실행 | 선택 영역 또는 caret 기준으로 포맷이 기대대로 반영 | 한글 입력기 활성 상태, 다중 줄 선택, 빈 선택 영역에서도 동작 확인 | Unit + Manual QA |
| A-15 | 명세 기반 | regression risk | 멀티 스텝 편집기와 템플릿, 미리보기 토글, `크게보기`가 한 흐름 안에서 동작한다 | 새 문서 작성 시작 | 템플릿 선택 후 본문 작성, 미리보기 토글, 크게보기 진입/복귀 | 데이터 손실 없이 단계 이동, 미리보기 토글, 집중 모드 유지 | 뒤로 가기/닫기 후 임시 입력 보존 여부는 추가 확인 필요 | E2E + Manual QA |
| A-16 | 추론 기반 | side effect | `APPROVED` 문서를 재편집 가능한 상태로 되돌릴 때 stale index가 정리된다 | 승인 후 재오픈 정책이 구현되어 있다고 가정 | 재오픈 또는 수정 플로우 실행 | Pod C 인덱스가 최신 문서와 불일치하지 않음 | 재오픈 API/트리거가 문서상 불명확하므로 세부 계약 확정 필요 | Integration |

### 6.4 모호하거나 충돌하는 항목

- stale index 정리 정책은 언급되지만 재오픈 트리거 API가 문서에 명시되지 않았습니다.
- 오류 응답 코드 체계는 공통 가이드만 있고 Pod A별 상세 코드 맵은 없습니다.
- `type-check` 실패 원인이 Pod A 외부 파일에 있어 Pod A 완료 기준을 CI에서 어디까지 허용할지 합의가 필요합니다.

## 7. Pod B 테스트 케이스

### 7.1 커버리지 요약

- 일정 CRUD와 타임존 처리, 팀 전체 일정 열람, 칸반 상태 연동이 핵심입니다.
- 자동 상태 동기화와 수동 조작 override 정책이 가장 높은 리스크 영역입니다.

### 7.2 우선 보완이 필요한 항목

- UTC와 Local Timezone 변환 검증
- RLS 완화 후 "전체 인증 유저 조회 가능, 수정은 본인만 가능" 규칙 검증
- 일정 기반 자동 상태 동기화와 수동 칸반 변경 충돌 검증
- FullCalendar 커스텀 상호작용 수동 QA

### 7.3 테스트 케이스 매트릭스

| ID | 근거 | 규칙 유형 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B-01 | 명세 기반 | happy path | 사용자가 일정을 생성한다 | 로그인 사용자와 유효한 `title`, `start_time`, `end_time` 준비 | `POST /api/schedules` 호출 | 일정이 저장되고 조회 기간 내 다시 반환된다 | 필수 필드 누락 시 거절 | Integration |
| B-02 | 명세 기반 | validation rule | 서버 UTC와 클라이언트 Local Timezone 간 변환이 일관되다 | 동일 일정을 KST 기준으로 입력할 테스트 데이터 준비 | 생성 후 `GET /api/schedules?start=&end=` 조회 | 화면 기준 시간과 저장 기준 시간이 의도대로 일치 | DST 경계 또는 자정 걸침 일정에서 오프셋 오류가 없어야 함 | Unit + Integration |
| B-03 | 명세 기반 | permission rule | 사용자는 본인 일정만 수정/삭제할 수 있다 | 사용자 A의 일정과 사용자 B 준비 | 수정 또는 삭제 시도 | 소유자만 성공 | 인증된 타 사용자는 읽기만 가능하고 변경은 거절 | Integration |
| B-04 | 명세 기반 | permission rule | 인증된 사용자는 팀원의 일정을 조회할 수 있다 | 사용자 A, B 각각 일정 보유 | B가 A 일정 포함 기간 조회 | 전체 인증 유저 조회 정책에 따라 팀원 일정이 보인다 | 비인증 사용자는 차단 | Integration |
| B-05 | 명세 기반 | state transition | 근태 상태가 일정 타입에 따라 자동 동기화된다 | `VACATION`, `MEETING`, `OFFLINE` 등 상태와 연결된 스케줄 준비 | 해당 시간대 진입 또는 조회 트리거 실행 | Teammates 칸반 카드가 일정 타입에 맞는 상태로 이동 | 시작 직전/종료 직후 경계 시각 오차 확인 | Integration |
| B-06 | 명세 기반 | state transition | 사용자가 칸반에서 상태를 수동 변경해도 시스템 스케줄이 우선 적용된다 | 자동 동기화 대상 시간대의 사용자 카드 준비 | 사용자가 칸반에서 다른 상태로 이동 | 시스템 스케줄 기준 상태로 다시 정렬된다 | 빠른 연속 조작에도 최종 상태가 스케줄 우선이어야 함 | E2E + Manual QA |
| B-07 | 명세 기반 | regression risk | 캘린더에서 다른 달 날짜를 클릭하면 해당 월로 즉시 이동한다 | FullCalendar 렌더링 상태 준비 | 현재 월이 아닌 날짜 클릭 | 화면 월이 해당 날짜의 월로 전환 | 모바일 뷰와 데스크톱 뷰 모두 확인 | E2E + Manual QA |
| B-08 | 명세 기반 | regression risk | 지난 날짜, 일요일, 오늘 날짜 커스텀 스타일이 유지된다 | 지난 날짜, 일요일, 오늘이 동시에 보이는 달 준비 | 캘린더 렌더링 확인 | 지정된 스타일 규칙이 요소별로 반영 | 테마 변경 또는 리렌더 시 스타일 손실 방지 | UI Snapshot + Manual QA |
| B-09 | 추론 기반 | validation rule | 종료 시간이 시작 시간보다 이르면 저장을 거절한다 | `end_time < start_time` payload 준비 | 생성 또는 수정 호출 | 검증 오류 반환 | 동일 시각 허용 여부는 정책 확인 필요 | Unit + Integration |
| B-10 | 추론 기반 | state transition | 자동 상태 동기화가 끝난 뒤 사용자의 기본 상태로 복귀한다 | 일정 시간 종료 후 상태 확인 환경 준비 | 종료 시각 이후 상태 조회 | 스케줄 기반 상태가 해제되고 기본 상태 또는 다음 스케줄 상태가 적용 | 복귀 우선순위는 문서상 미기재이므로 실제 정책 확정 필요 | Integration |

### 7.4 모호하거나 충돌하는 항목

- 작업 문서에는 일정 수정 API가 있으나 통합 API 문서에는 `PATCH`가 없습니다.
- 일정 `type` 값 목록과 `users.status` 매핑 테이블이 문서에 명시되어 있지 않습니다.
- 자동 상태 동기화의 트리거 시점이 실시간 배치인지, 조회 시 계산인지, DB 트리거인지 불명확합니다.

## 8. Pod C 테스트 케이스

### 8.1 커버리지 요약

- 스트리밍 채팅, 벡터 적재, RAG 검색, 관리자 동기화가 핵심입니다.
- 현재 가장 큰 리스크는 Pod B Function Calling 계약 미확정과 API 문서 누락입니다.

### 8.2 우선 보완이 필요한 항목

- `/api/chat` 스트리밍 응답 계약 검증
- 문서/회의록에서 들어오는 인덱싱 이벤트 검증
- RAG 검색 품질보다는 "올바른 후보를 조회하고 반환하는지"에 대한 계약 검증
- Pod B 일정 생성 Tool Calling payload 확정 후 통합 테스트 추가

### 8.3 테스트 케이스 매트릭스

| ID | 근거 | 규칙 유형 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | 명세 기반 | happy path | 사용자가 메시지 배열을 보내면 스트리밍 응답을 받는다 | `messages` 배열 준비 | `POST /api/chat` 호출 | HTTP 성공과 함께 실시간 텍스트 스트림 수신 | 빈 메시지 배열 또는 role 누락 시 거절 | Contract Test + E2E |
| C-02 | 명세 기반 | security rule | 클라이언트에 API 키가 노출되지 않는다 | 브라우저 번들, 네트워크 요청, 환경변수 사용 경로 확인 | 채팅 요청 수행 | 민감 키가 클라이언트 payload/소스에 노출되지 않음 | 에러 응답 본문에도 키 일부가 포함되면 안 됨 | Security Review + E2E |
| C-03 | 명세 기반 | side effect | 로컬 지식 문서를 관리자 동기화 API로 업서트한다 | 지식 문서 파일과 기존 벡터 데이터 준비 | `POST /api/admin/sync-knowledge` 호출 | 신규/변경 문서가 벡터 DB에 반영 | 동일 문서 재동기화 시 중복 레코드 누적 방지 | Integration |
| C-04 | 명세 기반 | validation rule | 임베딩 저장 규격이 `knowledge_vectors` 설계와 일치한다 | 벡터화 대상 문서 준비 | 적재 로직 실행 | `source_type`, `source_id`, `embedding(1536 dim)`, `metadata`가 저장 | 차원 수 불일치 또는 metadata 누락 시 실패 처리 | Unit + Integration |
| C-05 | 명세 기반 | side effect | Pod A 최종 승인 문서가 Pod C 인덱싱으로 연결된다 | Pod A 승인 완료 이벤트 mock 또는 실제 연동 준비 | 최종 승인 완료 | 해당 `source_id` 기준 벡터 적재 또는 갱신 수행 | 동일 승인 이벤트 재처리 시 idempotent해야 함 | Integration |
| C-06 | 명세 기반 | side effect | Pod D STT 완료 텍스트가 Pod C 인덱싱으로 연결된다 | STT 완료된 회의록 준비 | 인덱싱 이벤트 실행 | `SOURCE_TYPE=MEETING_LOGS`로 적재 | 원본 삭제/갱신 시 stale vector 정리 필요 | Integration |
| C-07 | 명세 기반 | regression risk | 응답 대기 중 로딩 스피너가 표시된다 | 채팅 UI 렌더링, 응답 지연 환경 준비 | 메시지 전송 | 응답 전까지 로딩 상태 표시, 완료 후 해제 | 스트리밍 중 중복 스피너 또는 영구 로딩 방지 | E2E + Manual QA |
| C-08 | 추론 기반 | side effect | 일정 의도 문장에 대해 Pod B 일정 생성 tool이 호출된다 | "내일 오후 2시에 회의 잡아줘" 같은 입력과 Tool mock 준비 | `POST /api/chat` 실행 | 모델이 Pod B 일정 생성 payload를 생성하고 호출한다 | 필수 시간 정보가 불충분하면 추정 생성 대신 재질문해야 함 | Contract Test + Integration |
| C-09 | 추론 기반 | error handling | 외부 LLM 또는 임베딩 호출 실패 시 사용자에게 일관된 오류를 반환한다 | OpenAI/임베딩 API 실패 mock 준비 | 채팅 또는 적재 요청 실행 | `{ "message": ... }` 계열 오류 응답 또는 UI 오류 안내 | 부분 스트림 후 실패 시 세션이 깨지지 않아야 함 | Integration |

### 8.4 모호하거나 충돌하는 항목

- 작업 문서에는 "유사도 높은 문서를 검색해오는 RAG 검색 API"가 있으나 통합 API 문서에는 별도 엔드포인트가 없습니다.
- `docs/pod-c-openai.json`에는 `/api/debug/seed`가 있으나 다른 통합 문서에는 나타나지 않습니다.
- 채팅 UI는 작업 문서상 미완료인데 `apps/web/tests/full-service.spec.ts`에는 채팅 시나리오가 존재하므로, 현재 테스트는 임시 UI 기준인지 최종 UX 기준인지 확인이 필요합니다.
- Pod B Function Calling JSON payload 규격이 아직 협의 중이라 자동화 스냅샷을 지금 고정하기 어렵습니다.

## 9. Pod D 테스트 케이스

### 9.1 커버리지 요약

- 업로드, STT, 파형 시각화, 히스토리, AI 정제, Pod C 인덱싱까지 범위가 넓습니다.
- 현재 리스크는 API/DB 문서 공백과 비동기 단계 상태 관리입니다.

### 9.2 우선 보완이 필요한 항목

- 파일 업로드부터 STT 완료까지 비동기 파이프라인 검증
- Signed URL과 `owner_id` 기반 격리 검증
- `UPLOADING` -> `TRANSCRIBING` -> `REFINING` -> `INDEXING` 상태 전이 검증
- Markdown 다운로드와 히스토리 목록 UX 검증

### 9.3 테스트 케이스 매트릭스

| ID | 근거 | 규칙 유형 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | 명세 기반 | happy path | 사용자가 음성 파일을 업로드한다 | 로그인 사용자, `.mp3` 또는 `.wav` 파일 준비 | `POST /api/meetings/upload` 호출 | 스토리지 업로드 성공, 응답에 `id`, `audio_url` 반환, `meeting_logs` 메타데이터 저장 | 비지원 형식 또는 빈 파일은 거절 | Integration |
| D-02 | 명세 기반 | permission rule | 오디오 파일 접근이 권한과 Signed URL 정책을 따른다 | 본인 파일과 타인 파일 준비 | 상세 조회 또는 재생 URL 발급 시도 | 소유자만 유효한 접근 권한을 얻는다 | URL 만료 후 재사용 방지 확인 | Integration |
| D-03 | 명세 기반 | regression risk | 브라우저 마이크 접근과 녹음 제어 UI가 정상 동작한다 | 마이크 권한 허용/거부 환경 각각 준비 | 시작, 일시정지, 재개, 중지 실행 | 버튼 상태와 녹음 상태가 일치 | 권한 거부 시 사용자 안내가 표시되어야 함 | E2E + Manual QA |
| D-04 | 명세 기반 | regression risk | 녹음된 Blob으로 파형 시각화가 렌더링된다 | 유효한 오디오 Blob 준비 | 녹음 완료 후 상세 뷰 진입 | waveform 컴포넌트가 표시된다 | 짧은 음성, 무음 파일에서도 크래시 없어야 함 | E2E + Manual QA |
| D-05 | 명세 기반 | happy path | STT 완료 후 상세 조회에 전사 텍스트가 노출된다 | 업로드된 회의록 준비 | STT 처리 완료 후 `GET /api/meetings/[id]` 호출 | `stt_text`와 생성 시각이 반환되고 상세 뷰에 표시 | 긴 전사문에서도 렌더링 성능 저하 확인 필요 | Integration |
| D-06 | 명세 기반 | error handling | Whisper/STT 호출 타임아웃이나 실패를 예외 처리한다 | STT 실패 mock 준비 | 전사 요청 실행 | 백엔드와 UI가 실패 상태를 일관되게 표시 | 재시도 중복 처리 시 중복 전사 작업 방지 | Integration + Manual QA |
| D-07 | 명세 기반 | side effect | STT 완료 텍스트와 `source_id`가 Pod C 인덱싱 이벤트로 전달된다 | STT 성공 회의록 준비 | 인덱싱 연동 실행 | Pod C에 올바른 source 정보가 전달 | 인덱싱 실패 시 사용자 상태가 영구 대기 상태가 되면 안 됨 | Integration |
| D-08 | 명세 기반 | permission rule | 히스토리 목록과 상세 보기는 `owner_id` 기준으로 격리된다 | 사용자 A, B 각각 회의록 준비 | 목록 및 상세 조회 | 본인 기록만 조회 가능 | 더미 ID 제거 후 세션 기반 격리 회귀 여부 확인 | Integration |
| D-09 | 명세 기반 | state transition | AI 정제 파이프라인 상태가 단계별로 전이된다 | 업로드 직후 회의록 준비 | 정제 플로우 실행 | `UPLOADING`, `TRANSCRIBING`, `REFINING`, `INDEXING` 상태가 순서대로 반영 | 중간 실패 시 어느 단계에서 멈췄는지 사용자에게 보여야 함 | Integration + E2E |
| D-10 | 명세 기반 | side effect | `refineMeetingLog`가 요약, 액션 아이템, 참여자 정보를 생성한다 | 전사 완료 회의록 준비 | `POST /api/meetings/[id]/summary` 또는 정제 트리거 실행 | 구조화된 결과가 저장 또는 응답된다 | JSON 파싱 실패 시 원본 전사문은 보존되어야 함 | Integration |
| D-11 | 명세 기반 | regression risk | 상세 화면에서 마크다운 다운로드가 가능하다 | 정제 완료된 회의록 준비 | 다운로드 버튼 클릭 | 마크다운 파일이 생성되고 내용이 현재 상세와 일치 | 한글, 줄바꿈, 목록 문법 깨짐 방지 | E2E + Manual QA |
| D-12 | 추론 기반 | validation rule | 업로드 용량 제한 또는 장시간 오디오 제한을 초과하면 거절한다 | 매우 큰 파일 준비 | 업로드 호출 | 명확한 오류 메시지와 함께 처리 중단 | 제한 수치 자체는 문서상 미정 | Integration |

### 9.4 모호하거나 충돌하는 항목

- `docs/Workpresso_API_명세서.md`에는 히스토리 목록 API, Signed URL 발급 API, 상태 조회 계약이 없습니다.
- `docs/DB설계서_최종본.md`의 `meeting_logs`는 `owner_id`, `audio_url`, `stt_text`만 제시하지만 Pod D 작업 문서는 제목, 요약, 액션 아이템, 참여자, `is_refined` 등을 전제로 합니다.
- STT 호출 주체가 Edge Function인지 서버 API인지 문서에 혼재되어 있어 장애 복구 테스트 기준이 다를 수 있습니다.

## 10. 추천 실행 순서

1. Pod A 상태 전이 및 권한 통합 테스트부터 고정합니다.
2. Pod B의 타임존, RLS, 자동 상태 동기화 계약을 확정합니다.
3. Pod C의 Tool Calling payload와 RAG API 범위를 먼저 문서화한 뒤 계약 테스트를 추가합니다.
4. Pod D의 업로드-STT-정제-인덱싱 파이프라인을 비동기 상태 기준으로 나눠 검증합니다.

## 11. 바로 다음 액션

- `docs/Workpresso_API_명세서.md`에 Pod B PATCH, Pod C RAG 검색, Pod D 히스토리/정제 응답 스키마를 보강합니다.
- Pod A의 남은 수동 QA 항목을 체크리스트 기반으로 실제 실행합니다.
- Pod C Function Calling payload가 확정되면 C-08을 명세 기반 케이스로 승격합니다.
- Pod D 확장 컬럼이 DB 최종본에 반영되면 D-09 ~ D-11을 DB 계약 기반으로 재검토합니다.
