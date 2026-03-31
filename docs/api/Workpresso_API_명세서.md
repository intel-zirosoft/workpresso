 🌐 WorkPresso 통합 API 명세서 (Draft)

  Base URL: http://localhost:3000  
  Auth: Supabase Auth 세션 기반 (`Bearer Token` 사용 권장)

  ---

  📄 Pod A: 결재 문서 (Documents) Workflow v2

  **상태값**
   * 문서 상태: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`
   * 결재 단계 상태: `WAITING`, `PENDING`, `APPROVED`, `REJECTED`
   * 목록 scope: `authored`, `approvals`, `cc`

  **공통 응답 필드**
   * `DocumentUser`: `{ "id": "uuid", "name": "string", "department": "string | null" }`
   * `ApprovalStep`: `{ "id": "uuid", "stepOrder": 1, "stepLabel": "팀장", "approverId": "uuid", "approver": DocumentUser, "status": "PENDING", "actedAt": "timestamp | null", "comment": "string | null" }`
   * `CcRecipient`: `{ "id": "uuid", "recipientId": "uuid", "recipient": DocumentUser }`
   * `DocumentPermissions`: `{ "canEdit": true, "canSubmit": true, "canApprove": false, "canReject": false }`
   * `DocumentSummary`: `{ "id": "uuid", "authorId": "uuid", "title": "string", "content": "string", "status": "DRAFT", "submittedAt": "timestamp | null", "finalApprovedAt": "timestamp | null", "createdAt": "timestamp", "updatedAt": "timestamp", "author": DocumentUser, "currentStepLabel": "string | null", "currentApprover": "DocumentUser | null", "approvalStepCount": 3, "ccRecipientCount": 2 }`
   * `DocumentDetail`: `DocumentSummary` + `{ "approvalSteps": ApprovalStep[], "ccRecipients": CcRecipient[], "permissions": DocumentPermissions }`

  [GET] /api/documents
   * 설명: 로그인 사용자의 문서 목록을 scope 기준으로 조회합니다.
   * 쿼리 파라미터:
     * `scope`: `authored` | `approvals` | `cc` (기본값 `authored`)
     * `status`: `DRAFT` | `PENDING` | `APPROVED` | `REJECTED` (선택)
   * 응답:
   * `{ "documents": DocumentSummary[] }`

  [POST] /api/documents
   * 설명: 새 결재 문서를 초안(`DRAFT`)으로 생성합니다.
   * Body:
   * `{
        "authorId": "uuid",
        "title": "2026년 2분기 협업 운영 계획",
        "content": "# 문서 제목\n\n본문",
        "approvalSteps": [
          { "stepLabel": "팀장", "approverId": "uuid" },
          { "stepLabel": "부서장", "approverId": "uuid" }
        ],
        "ccRecipientIds": ["uuid"]
      }`
   * 응답:
   * `{ "document": DocumentDetail }`
   * 비고:
     * `authorId`는 현재 로그인 사용자와 일치해야 합니다.
     * 결재선 approver 중복 불가, 공람자 중복 불가

  [GET] /api/documents/[id]
   * 설명: 작성자 / 현재 결재자 / 공람자에게 허용된 문서 상세를 조회합니다.
   * 응답:
   * `{ "document": DocumentDetail }`

  [PATCH] /api/documents/[id]
   * 설명: 수정 가능한 문서(`DRAFT`, `REJECTED`)의 제목, 본문, 결재선, 공람자를 수정합니다.
   * Body:
   * `{
        "title": "수정 후 제목",
        "content": "수정 후 본문",
        "approvalSteps": [
          { "stepLabel": "팀장", "approverId": "uuid" }
        ],
        "ccRecipientIds": ["uuid"]
      }`
   * 응답:
   * `{ "document": DocumentDetail }`

  [POST] /api/documents/[id]/submit
   * 설명: 초안 또는 재편집된 문서를 결재 요청 상태로 제출합니다.
   * Body: 없음
   * 응답:
   * `{ "document": DocumentDetail }`
   * 비고:
     * 제출 시 문서 상태는 `PENDING`으로 전환됩니다.
     * 첫 번째 결재 단계만 `PENDING`, 나머지 단계는 `WAITING` 상태가 됩니다.

  [POST] /api/documents/[id]/approval
   * 설명: 현재 `PENDING` 단계의 approver가 승인 또는 반려 액션을 수행합니다.
   * Body:
   * `{ "action": "APPROVE" | "REJECT", "comment": "string (optional)" }`
   * 응답:
   * `{ "document": DocumentDetail }`
   * 비고:
     * 중간 승인 시 다음 단계가 `PENDING`으로 활성화됩니다.
     * 마지막 단계 승인 시 문서 상태는 `APPROVED`로 전환됩니다.
     * 반려 시 문서 상태는 `REJECTED`로 전환되며 작성자가 다시 편집할 수 있습니다.

  [GET] /api/users
   * 설명: Pod A 문서 결재선 / 공람 대상 선택용 사용자 목록을 조회합니다.
   * 응답:
   * `{ "users": DocumentUser[] }`

  **Pod A UI/UX 계약**
   * `/documents` 메인 화면은 문서 탐색 중심이며, 긴 목록은 탐색 컨테이너 내부에서 스크롤됩니다.
   * 문서 선택 시 읽기 전용 상세는 페이지 내 패널이 아니라 모달 오버레이로 노출됩니다.
   * 새 문서 작성과 수정은 대형 편집 오버레이에서 수행합니다.
   * 편집기는 `템플릿 선택 → 제목/본문 → 결재선/공람` 멀티 스텝 구조를 사용합니다.
   * 본문 미리보기는 상시 노출이 아니라 토글 방식이며 `Ctrl/Cmd+Shift+V` 단축키를 지원합니다.
   * content step에서는 `크게보기` 집중 모드를 제공하며, 집중 모드 안에서도 `편집 / 미리보기` 전환을 유지합니다.

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
