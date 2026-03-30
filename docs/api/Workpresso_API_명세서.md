# 🌐 WorkPresso 통합 API 명세서 (Draft)

Base URL: `http://localhost:3000`  
Auth: Supabase Auth 세션 기반 (`Bearer Token` 사용 권장)

---

## 📄 Pod A: 결재 문서 (Documents) Workflow v2

### 상태값

- 문서 상태: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`
- 결재 단계 상태: `WAITING`, `PENDING`, `APPROVED`, `REJECTED`
- 목록 scope: `authored`, `approvals`, `cc`
- 승인 액션: `APPROVE`, `REJECT`

### 공통 응답 필드

- `DocumentUser`
  `{ "id": "uuid", "name": "string", "department": "string | null" }`
- `ApprovalStep`
  `{ "id": "uuid", "stepOrder": 1, "stepLabel": "팀장", "approverId": "uuid", "approver": DocumentUser, "status": "PENDING", "actedAt": "timestamp | null", "comment": "string | null" }`
- `CcRecipient`
  `{ "id": "uuid", "recipientId": "uuid", "recipient": DocumentUser }`
- `DocumentJiraLink`
  `{ "id": "uuid", "issueKey": "KAN-1", "issueUrl": "https://workpresso.atlassian.net/browse/KAN-1", "issueType": "에픽", "summary": "Workpresso 운영 계획", "status": "할 일", "syncedAt": "timestamp | null" }`
- `DocumentPermissions`
  `{ "canEdit": true, "canSubmit": true, "canApprove": false, "canReject": false, "canSyncJira": false }`
- `DocumentSummary`
  `{ "id": "uuid", "authorId": "uuid", "title": "string", "content": "string", "status": "DRAFT", "submittedAt": "timestamp | null", "finalApprovedAt": "timestamp | null", "createdAt": "timestamp", "updatedAt": "timestamp", "author": DocumentUser, "currentStepLabel": "string | null", "currentApprover": "DocumentUser | null", "approvalStepCount": 3, "ccRecipientCount": 2 }`
- `DocumentDetail`
  `DocumentSummary` + `{ "approvalSteps": ApprovalStep[], "ccRecipients": CcRecipient[], "jiraLinks": DocumentJiraLink[], "permissions": DocumentPermissions }`

### 입력 검증 규칙

- `title`: 1~120자
- `content`: 최대 20,000자
- `approvalSteps`: 최소 1개 이상 필요
- `approvalSteps[].stepLabel`: 1~40자
- `approvalSteps[].approverId`: UUID
- `ccRecipientIds[]`: UUID 배열
- 결재선 approver 중복 불가
- 공람자 중복 불가
- `approval.comment`: 최대 500자

### [GET] /api/documents

- 설명: 로그인 사용자의 문서 목록을 scope 기준으로 조회합니다.
- 쿼리 파라미터:
  - `scope`: `authored` | `approvals` | `cc` (기본값 `authored`)
  - `status`: `DRAFT` | `PENDING` | `APPROVED` | `REJECTED` (선택)
- 응답:
  ```json
  { "documents": [DocumentSummary] }
  ```
- 비고:
  - `authored`: 내가 작성한 문서
  - `approvals`: 내가 현재 결재해야 하는 `PENDING` 단계 문서
  - `cc`: 내가 공람자로 지정된 문서

### [POST] /api/documents

- 설명: 새 결재 문서를 초안(`DRAFT`)으로 생성합니다.
- Body:
  ```json
  {
    "authorId": "uuid",
    "title": "2026년 2분기 협업 운영 계획",
    "content": "# 문서 제목\n\n본문",
    "approvalSteps": [
      { "stepLabel": "팀장", "approverId": "uuid" },
      { "stepLabel": "부서장", "approverId": "uuid" }
    ],
    "ccRecipientIds": ["uuid"]
  }
  ```
- 성공 응답: `201 Created`
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - `authorId`는 현재 로그인 사용자와 일치해야 합니다.
  - 생성 시 문서 상태는 항상 `DRAFT`입니다.

### [GET] /api/documents/[id]

- 설명: 작성자, 결재선 참여자, 공람자에게 허용된 문서 상세를 조회합니다.
- 응답:
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - 현재 결재자가 아니더라도 결재선에 포함된 사용자는 상세 조회가 가능합니다.
  - 권한이 없거나 문서가 없으면 `404`를 반환합니다.

### [PATCH] /api/documents/[id]

- 설명: 수정 가능한 문서(`DRAFT`, `REJECTED`)의 제목, 본문, 결재선, 공람자를 수정합니다.
- Body:
  ```json
  {
    "title": "수정 후 제목",
    "content": "수정 후 본문",
    "approvalSteps": [
      { "stepLabel": "팀장", "approverId": "uuid" }
    ],
    "ccRecipientIds": ["uuid"]
  }
  ```
- 응답:
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - 작성자만 수정할 수 있습니다.
  - `PENDING`, `APPROVED` 상태 문서는 수정할 수 없습니다.
  - 수정 시 결재선과 공람자는 전체 재구성됩니다.
  - 수정 시 `finalApprovedAt`는 `null`로 초기화됩니다.

### [POST] /api/documents/[id]/submit

- 설명: 초안 또는 반려 후 재편집된 문서를 결재 요청 상태로 제출합니다.
- Body: 없음
- 응답:
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - 작성자만 제출할 수 있습니다.
  - 제출 시 문서 상태는 `PENDING`으로 전환됩니다.
  - 모든 결재 단계는 초기화된 뒤 첫 번째 단계만 `PENDING`, 나머지는 `WAITING`이 됩니다.
  - `submittedAt`는 제출 시각으로 갱신되고 `finalApprovedAt`는 `null`로 초기화됩니다.

### [POST] /api/documents/[id]/approval

- 설명: 현재 `PENDING` 단계의 approver가 승인 또는 반려 액션을 수행합니다.
- Body:
  ```json
  { "action": "APPROVE" | "REJECT", "comment": "string (optional)" }
  ```
- 응답:
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - 현재 활성 `PENDING` 단계의 approver만 호출할 수 있습니다.
  - `APPROVE` 시 다음 단계가 있으면 그 단계가 `PENDING`으로 활성화됩니다.
  - 마지막 단계 승인 시 문서 상태는 `APPROVED`, `finalApprovedAt`는 승인 시각으로 갱신됩니다.
  - `REJECT` 시 문서 상태는 `REJECTED`가 되며 작성자가 다시 편집할 수 있습니다.
  - 반려 코멘트는 `REJECT`일 때만 저장됩니다.
  - 최종 승인 시 Pod C 지식 동기화가 비동기적으로 호출될 수 있습니다.
  - 제출/승인/반려 시 Slack Webhook이 설정되어 있으면 Pod A 문서 상태 알림이 비동기로 발송될 수 있습니다.

### [POST] /api/documents/[id]/jira

- 설명: 승인 완료된 작성 문서를 Jira 프로젝트로 연동하고, 생성된 이슈 링크를 문서에 저장합니다.
- Body: 없음
- 응답:
  ```json
  { "document": DocumentDetail }
  ```
- 비고:
  - 작성자만 호출할 수 있습니다.
  - 현재 구현은 `APPROVED` 상태 문서만 연동 가능합니다.
  - 문서 본문에서 체크리스트, 기능 섹션 불릿, 표 첫 열 항목을 추출해 Jira 이슈를 생성합니다.
  - Jira 프로젝트에 Epic 타입이 존재하면 문서 제목 기준 Epic 1건을 우선 만들고, 하위 Feature/Task를 이어서 생성합니다.
  - 이미 Jira 링크가 저장된 문서는 중복 생성하지 않고 기존 링크를 반환합니다.
  - 문서 상세 조회 시 저장된 Jira 링크의 상태를 on-demand로 동기화할 수 있습니다.

### [PATCH] /api/documents/[id]/status

- 설명: 직접 상태 변경 API는 더 이상 지원되지 않습니다.
- 응답: `410 Gone`
  ```json
  {
    "message": "직접 상태 변경 API는 더 이상 지원되지 않습니다. /submit 또는 /approval 엔드포인트를 사용해 주세요."
  }
  ```

### [GET] /api/users

- 설명: Pod A 문서 결재선 / 공람 대상 선택용 사용자 목록을 조회합니다.
- 응답:
  ```json
  {
    "users": [
      {
        "id": "uuid",
        "name": "홍길동",
        "department": "Product",
        "status": "ACTIVE | VACATION | MEETING | OFFLINE | REMOTE | OUTSIDE | HALF_DAY",
        "isAutoSynced": false
      }
    ]
  }
  ```
- 비고:
  - 기본 사용자 정보는 Pod A 문서 선택용으로 사용합니다.
  - `status`, `isAutoSynced`는 현재 진행 중인 일정 상태를 반영한 보조 필드입니다.

### Pod A UI/UX 계약

- `/documents` 메인 화면은 문서 탐색 중심이며, 긴 목록은 탐색 컨테이너 내부에서 스크롤됩니다.
- 메인 화면은 `내 문서 Grid`, `내 결재함`, `공람 문서` 관점을 분리해 탐색합니다.
- 문서 선택 시 읽기 전용 상세는 페이지 내 패널이 아니라 모달 오버레이로 노출됩니다.
- 새 문서 작성과 수정은 대형 편집 오버레이에서 수행합니다.
- 편집기는 `템플릿 선택 → 제목/본문 → 결재선/공람` 멀티 스텝 구조를 사용합니다.
- `프로젝트 승인 요청서` 템플릿은 Jira 자동 생성을 돕기 위해 `기능 명세`, `작업 체크리스트` 기본 섹션을 포함합니다.
- 본문 미리보기는 상시 노출이 아니라 토글 방식이며 `Ctrl/Cmd+Shift+V` 단축키를 지원합니다.
- content step에서는 `크게보기` 집중 모드를 제공하며, 집중 모드 안에서도 `편집 / 미리보기` 전환을 유지합니다.
- 승인 완료 문서 상세에서는 `Jira 이슈 생성` 버튼과 연결된 Jira 위젯을 제공합니다.

### 공통 에러 응답 원칙

- 인증 없음: `401`
  ```json
  { "message": "문서 기능을 사용하려면 로그인이 필요합니다." }
  ```
- 입력 검증 실패: `400`
  ```json
  {
    "message": "문서 입력값이 올바르지 않습니다.",
    "errors": { "...": "..." }
  }
  ```
- 권한 없음 또는 상태 위반: 주로 `400` 또는 `404`
- 서버 처리 실패: `500`

---

  📅 Pod B: 업무 일정 (Schedules)

  [GET] /api/schedules
   * 설명: 특정 기간 내의 일정 목록을 조회합니다.
   * 쿼리 파라미터: start, end (ISO 8601)

  [POST] /api/schedules
   * 설명: 새로운 일정을 등록합니다. (AI 에이전트의 Function Calling이 호출하는 핵심 API)
   * Body: 

   1     {
   2       "title": "주간 회의",
   3       "start_time": "2024-03-25T14:00:00Z",
   4       "end_time": "2024-03-25T15:00:00Z"
   5     }

  [DELETE] /api/schedules/[id]
   * 설명: 특정 일정을 삭제합니다.

  ---

  🤖 Pod C: AI 및 지식 (AI & Knowledge)

  [POST] /api/chat
   * 설명: AI 비서와 대화합니다 (RAG 및 일정 등록 도구 포함).
   * Body: { "messages": [...] }
   * 응답: 실시간 스트리밍 텍스트

  [POST] /api/admin/sync-knowledge
   * 설명: 로컬 지식 문서를 벡터 DB와 동기화합니다.

  ---

  🎙️ Pod D: 회의록 및 음성 (Meeting Logs)

  [POST] /api/meetings/upload
   * 설명: 회의 음성 파일(.mp3, .wav)을 업로드합니다.
   * Body: FormData (file)
   * 응답: { "id": "uuid", "audio_url": "url" }

  [GET] /api/meetings/[id]
   * 설명: 특정 회의의 상세 내용 및 STT(텍스트 변환) 결과를 조회합니다.
   * 응답:

   1     {
   2       "id": "uuid",
   3       "stt_text": "오늘 회의 주제는...",
   4       "created_at": "timestamp"
   5     }

  [POST] /api/meetings/[id]/summary
   * 설명: AI를 사용하여 회의 내용을 요약합니다 (Pod C와 연동).

  ---

  👤 공통: 사용자 및 설정 (Common)

  [GET] /api/users/me
   * 설명: 현재 로그인한 사용자의 정보를 조회합니다.

  [PATCH] /api/users/status
   * 설명: 사용자의 상태를 변경합니다 (ACTIVE, VACATION, MEETING, OFFLINE).

  ---

  💡 통합 개발 가이드

   1. 데이터 일관성: 모든 API는 응답 시 packages/db/schema.db에 정의된 필드명을 엄격히 준수해야 합니다.
   2. 에러 처리: 에러 발생 시 `{ "message": "메시지" }` 형태의 일관된 JSON 응답을 우선 사용하며, 입력 검증 실패 시 `errors` 필드를 추가할 수 있습니다.
   3. 에이전트 연동: Pod B, Pod D의 데이터가 생성될 때 Pod C의 벡터 DB에 자동으로 적재되도록 설계하는 것이 핵심입니다.
