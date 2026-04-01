🌐 WorkPresso 통합 API 명세서 (Current Web Implementation 기준)

Base URL: `http://localhost:3000`  
Auth: 기본적으로 Supabase Auth 세션(cookie) 기반, 일부 서버 간/관리용 API는 별도 주의사항 참고

---

## 공통 규칙

- 공개 API는 기본적으로 로그인 세션이 필요합니다.
- 에러 응답은 현재 구현상 `{"message":"..."}` 와 `{"error":"..."}` 가 혼용됩니다.
- 시간값은 ISO 8601 문자열을 사용합니다.
- 일부 API는 생성/수정 시 Pod C 지식 저장소와 자동 동기화됩니다.

---

## 📄 Pod A: 결재 문서 (Documents) Workflow v2

### 상태값

- 문서 상태: `DRAFT` | `PENDING` | `APPROVED` | `REJECTED`
- 결재 단계 상태: `WAITING` | `PENDING` | `APPROVED` | `REJECTED`
- 목록 scope: `authored` | `approvals` | `cc`
- 승인 액션: `APPROVE` | `REJECT`

### 공통 응답 필드

- `DocumentUser`
  - `{ "id": "uuid", "name": "string", "department": "string | null" }`
- `ApprovalStep`
  - `{ "id": "uuid", "stepOrder": 1, "stepLabel": "팀장", "approverId": "uuid", "approver": DocumentUser, "status": "PENDING", "actedAt": "timestamp | null", "comment": "string | null" }`
- `CcRecipient`
  - `{ "id": "uuid", "recipientId": "uuid", "recipient": DocumentUser }`
- `DocumentPermissions`
  - `{ "canEdit": true, "canSubmit": true, "canApprove": false, "canReject": false, "canDelete": false }`
- `DocumentSummary`
  - `{ "id": "uuid", "authorId": "uuid", "title": "string", "content": "string", "status": "DRAFT", "submittedAt": "timestamp | null", "finalApprovedAt": "timestamp | null", "createdAt": "timestamp", "updatedAt": "timestamp", "author": DocumentUser, "currentStepLabel": "string | null", "currentApprover": "DocumentUser | null", "approvalStepCount": 3, "ccRecipientCount": 2, "viewerApprovalStatus": "WAITING | PENDING | APPROVED | REJECTED | null" }`
- `DocumentDetail`
  - `DocumentSummary + { "approvalSteps": ApprovalStep[], "ccRecipients": CcRecipient[], "permissions": DocumentPermissions }`

### [GET] /api/documents

- 설명: 로그인 사용자의 문서 목록을 scope 기준으로 조회합니다.
- 쿼리 파라미터
  - `scope`: `authored` | `approvals` | `cc` (기본값 `authored`)
  - `status`: `DRAFT` | `PENDING` | `APPROVED` | `REJECTED` (선택)
- 응답
  - `{ "documents": DocumentSummary[] }`

### [POST] /api/documents

- 설명: 새 결재 문서를 초안(`DRAFT`)으로 생성합니다.
- Body
  - `{
      "authorId": "uuid",
      "title": "2026년 2분기 협업 운영 계획",
      "content": "# 문서 제목\n\n본문",
      "approvalSteps": [
        { "stepLabel": "팀장", "approverId": "uuid" },
        { "stepLabel": "부서장", "approverId": "uuid" }
      ],
      "ccRecipientIds": ["uuid"]
    }`
- 응답
  - `{ "document": DocumentDetail }`
- 비고
  - `authorId`는 현재 로그인 사용자와 일치해야 합니다.
  - 결재선 approver 중복 불가, 공람자 중복 불가

### [GET] /api/documents/[id]

- 설명: 작성자 / 현재 결재자 / 공람자에게 허용된 문서 상세를 조회합니다.
- 응답
  - `{ "document": DocumentDetail }`

### [PATCH] /api/documents/[id]

- 설명: 수정 가능한 문서(`DRAFT`, `REJECTED`)의 제목, 본문, 결재선, 공람자를 수정합니다.
- Body
  - `{
      "title": "수정 후 제목",
      "content": "수정 후 본문",
      "approvalSteps": [
        { "stepLabel": "팀장", "approverId": "uuid" }
      ],
      "ccRecipientIds": ["uuid"]
    }`
- 응답
  - `{ "document": DocumentDetail }`

### [DELETE] /api/documents/[id]

- 설명: 삭제 가능한 문서를 삭제합니다.
- 응답
  - `204 No Content`

### [POST] /api/documents/[id]/submit

- 설명: 초안 또는 재편집된 문서를 결재 요청 상태로 제출합니다.
- Body: 없음
- 응답
  - `{ "document": DocumentDetail }`
- 비고
  - 제출 시 문서 상태는 `PENDING`으로 전환됩니다.
  - 첫 번째 결재 단계만 `PENDING`, 나머지 단계는 `WAITING` 상태가 됩니다.

### [POST] /api/documents/[id]/approval

- 설명: 현재 `PENDING` 단계의 approver가 승인 또는 반려 액션을 수행합니다.
- Body
  - `{ "action": "APPROVE" | "REJECT", "comment": "string (optional)" }`
- 응답
  - `{ "document": DocumentDetail }`
- 비고
  - 중간 승인 시 다음 단계가 `PENDING`으로 활성화됩니다.
  - 마지막 단계 승인 시 문서 상태는 `APPROVED`로 전환됩니다.
  - 반려 시 문서 상태는 `REJECTED`로 전환되며 작성자가 다시 편집할 수 있습니다.

### Pod A UI/UX 계약

- `/documents` 메인 화면은 문서 탐색 중심이며, 긴 목록은 탐색 컨테이너 내부에서 스크롤됩니다.
- 문서 선택 시 읽기 전용 상세는 페이지 내 패널이 아니라 모달 오버레이로 노출됩니다.
- 새 문서 작성과 수정은 대형 편집 오버레이에서 수행합니다.
- 편집기는 `템플릿 선택 → 제목/본문 → 결재선/공람` 멀티 스텝 구조를 사용합니다.
- 본문 미리보기는 상시 노출이 아니라 토글 방식이며 `Ctrl/Cmd+Shift+V` 단축키를 지원합니다.
- content step에서는 `크게보기` 집중 모드를 제공하며, 집중 모드 안에서도 `편집 / 미리보기` 전환을 유지합니다.

---

## 📅 Pod B: 업무 일정 (Schedules)

### 상태값

- 일정 타입: `TASK` | `MEETING` | `VACATION` | `WFH` | `OUTSIDE` | `HALF_DAY`

### 공통 필드

- `Schedule`
  - 핵심 필드: `{ "id": "uuid", "title": "string", "start_time": "timestamp", "end_time": "timestamp", "type": "TASK | MEETING | VACATION | WFH | OUTSIDE | HALF_DAY" }`
  - 실제 DB row 기준으로 `user_id`, `created_at`, `updated_at`, `deleted_at` 등이 함께 포함될 수 있습니다.

### [GET] /api/schedules

- 설명: 로그인 사용자의 비삭제 일정 목록을 시작 시간 오름차순으로 조회합니다.
- 쿼리 파라미터
  - 현재 구현 기준 없음
- 응답
  - `Schedule[]`
- 비고
  - 이전 draft에 있던 `start`, `end` 기간 필터는 현재 웹 구현에 반영되어 있지 않습니다.

### [POST] /api/schedules

- 설명: 새로운 일정을 등록합니다.
- Body
  - `{
      "title": "주간 회의",
      "start_time": "2026-03-31T14:00:00Z",
      "end_time": "2026-03-31T15:00:00Z",
      "type": "MEETING"
    }`
- 응답
  - 생성된 `Schedule`
- 비고
  - `type` 미지정 시 기본값은 `TASK`
  - 생성 성공 시 Pod C 지식 저장소에 자동 동기화 시도

### [PATCH] /api/schedules/[id]

- 설명: 내 일정의 일부 또는 전체 필드를 수정합니다.
- Body
  - `{
      "title": "수정된 일정 제목",
      "start_time": "2026-03-31T14:30:00Z",
      "end_time": "2026-03-31T15:30:00Z",
      "type": "TASK"
    }`
- 응답
  - 수정된 `Schedule`
- 비고
  - partial update 지원
  - 수정 성공 시 Pod C 지식 저장소도 갱신 시도

### [DELETE] /api/schedules/[id]

- 설명: 특정 일정을 삭제합니다.
- 응답
  - `204 No Content`
- 비고
  - 현재 구현은 hard delete가 아니라 `deleted_at` 기반 소프트 삭제
  - 삭제 성공 시 Pod C 지식 저장소에서도 제거 시도

---

## 🤖 Pod C: AI 및 지식 (AI & Knowledge)

### [POST] /api/chat

- 설명: AI 비서와 대화합니다.
- Body
  - `{ "messages": [{ "role": "user" | "assistant" | "system", "content": "..." }] }`
- 응답
  - 스트리밍 텍스트 응답
- 비고
  - 내부 지식 검색(RAG) 사용
  - 일정 생성이 필요한 경우 내부적으로 `/api/schedules` 기반 tool 호출 사용
  - 상대 시간 표현은 서버 시각/시간대를 기준으로 해석

### [POST] /api/admin/sync-knowledge

- 설명: 로컬 knowledge-base markdown 파일을 벡터 DB와 동기화합니다.
- Body: 없음
- 응답
  - `{ "success": true, "synced_files": ["...md"], "count": 3 }`
- 주의
  - 현재 웹 구현 기준으로는 별도 인증/권한 체크가 없습니다.
  - 운영 환경에서는 관리자 보호가 필요합니다.

### [POST] /api/knowledge/sync

- 설명: 외부/내부 소스 내용을 지식 저장소에 upsert 합니다.
- Body
  - `{
      "sourceType": "DOCUMENTS | MEETING_LOGS | SCHEDULES | CHAT_THREADS",
      "sourceId": "uuid",
      "title": "string | null",
      "content": "string",
      "metadata": {}
    }`
- 응답
  - `{ "success": true }`

### [DELETE] /api/knowledge/sync

- 설명: 특정 지식 소스를 제거합니다.
- Body
  - `{
      "sourceType": "DOCUMENTS | MEETING_LOGS | SCHEDULES | CHAT_THREADS",
      "sourceId": "uuid"
    }`
- 응답
  - `204 No Content`

---

## 🎙️ Pod D: 회의록 및 음성 (Meeting Logs / Audio)

> 현재 공개 REST API는 회의록 CRUD보다 음성 전사 및 오디오 접근에 초점이 맞춰져 있습니다.  
> `meeting_logs` 데이터 자체는 현재 웹 구현에서 서비스/서버 액션과 Supabase 연동으로 관리됩니다.

### [POST] /api/audio/transcribe

- 설명: 업로드한 오디오 파일을 텍스트로 전사합니다.
- Body
  - `FormData`
    - `file`: `File` 필수
    - `prompt`: `string` 선택
- 응답
  - `{ "text": "전사 결과", "model": "model-name" }`

### [GET] /api/audio/[...path]

- 설명: 저장소에 있는 회의 오디오 파일을 프록시합니다.
- 응답
  - 오디오 바이너리 스트림

### 현재 구현 메모

- 이전 draft의 `/api/meetings/upload`, `/api/meetings/[id]`, `/api/meetings/[id]/summary` 공개 라우트는 현재 `apps/web` 기준으로 구현되어 있지 않습니다.
- 회의록 정제 결과의 지식 동기화는 내부 API `/api/internal/pod-d/meeting-refined` 를 통해 처리됩니다.

---

## 💬 Pod E: Chatter

### 공통 응답 필드

- `ChatterChannelSummary`
  - `{ "id": "uuid", "name": "string", "description": "string", "type": "ANNOUNCEMENT | DEPARTMENT | PROJECT | DM", "unreadCount": 0, "memberCount": 8, "lastMessagePreview": "string", "lastActivityAt": "timestamp | null" }`
- `ChatterMessageSummary`
  - `{ "id": "uuid", "authorId": "uuid", "authorName": "string", "authorRole": "string", "content": "string", "messageType": "TEXT | SYSTEM | FILE | LINKED_OBJECT", "createdAt": "timestamp", "isMine": true, "links": ChatterLinkCard[] }`
- `ChatterLinkCard`
  - `{ "id": "uuid", "label": "string", "kind": "문서 | 일정", "meta": "string" }`

### [GET] /api/chatter/channels

- 설명: 로그인 사용자가 접근 가능한 채널 목록을 조회합니다.
- 응답
  - `{ "channels": ChatterChannelSummary[] }`

### [GET] /api/chatter/channels/[id]/messages

- 설명: 특정 채널의 메시지와 공유 후보 객체를 조회합니다.
- 응답
  - `{
      "channel": {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "type": "ANNOUNCEMENT | DEPARTMENT | PROJECT | DM",
        "members": [],
        "pins": [],
        "sharedItems": []
      },
      "messages": ChatterMessageSummary[],
      "shareTargets": {
        "documents": [],
        "schedules": []
      }
    }`

### [POST] /api/chatter/channels/[id]/messages

- 설명: 텍스트 메시지 또는 링크 객체가 포함된 메시지를 생성합니다.
- Body
  - `{
      "content": "메시지 내용",
      "linkedObject": {
        "type": "DOCUMENT | SCHEDULE",
        "id": "uuid"
      }
    }`
- 응답
  - `{ "message": ChatterMessageSummary }`
- 비고
  - `content` 또는 `linkedObject` 둘 중 하나는 필요

---

## 👤 공통: 사용자 및 설정 (Common)

### 사용자 상태값

- `ACTIVE` | `VACATION` | `MEETING` | `OFFLINE` | `REMOTE` | `OUTSIDE` | `HALF_DAY`

### [GET] /api/users

- 설명: 사용자 목록을 조회합니다. 문서 결재선 선택과 팀 현황 화면에서 함께 사용합니다.
- 응답
  - `{
      "users": [
        {
          "id": "uuid",
          "name": "string",
          "department": "string | null",
          "status": "ACTIVE | VACATION | MEETING | OFFLINE | REMOTE | OUTSIDE | HALF_DAY",
          "isAutoSynced": true
        }
      ]
    }`
- 비고
  - 현재 시점의 활성 일정 타입을 기반으로 상태가 자동 보정될 수 있습니다.

### [GET] /api/users/me

- 설명: 현재 로그인한 사용자의 정보를 조회합니다.
- 응답
  - `{ "id": "uuid", "email": "string | null", "name": "string | null", "department": "string | null", "role": "string | null", "status": "string | null" }`

### [PATCH] /api/users/status

- 설명: 현재 사용자의 상태를 변경합니다.
- Body
  - `{ "status": "ACTIVE | VACATION | MEETING | OFFLINE | REMOTE | OUTSIDE | HALF_DAY" }`
- 응답
  - `{
      "id": "uuid",
      "status": "ACTIVE | VACATION | MEETING | OFFLINE | REMOTE | OUTSIDE | HALF_DAY",
      "isOverridden": true,
      "originalRequestedStatus": "ACTIVE"
    }`
- 비고
  - 현재 활성 일정이 있으면 수동 상태 변경이 override 될 수 있습니다.
  - 우선순위: `VACATION > OUTSIDE > HALF_DAY > MEETING > WFH(REMOTE)`

---

## 🔁 Automation API

### [GET] /api/automation/daily-briefing

- 설명: 오늘 일정과 Jira 이슈를 조합해 Slack 브리핑 페이로드를 생성/전송합니다.
- 응답
  - `{ "success": true, "mode": "sent | preview", "isJiraDummy": true, "previewPayload": {} }`

### [GET] /api/automation/meeting-reminder

- 설명: 곧 시작하는 회의 일정에 대한 리마인더를 생성/전송합니다.
- 응답
  - 예정 회의가 없으면 `{ "success": true, "message": "...", "checkedAt": "...", "windowStart": "...", "windowEnd": "..." }`
  - 예정 회의가 있으면 `{ "success": true, "remindersCount": 1, "results": [...] }`

### [POST] /api/automation/focus-time

- 설명: 높은 우선순위 Jira 이슈를 기반으로 집중 근무 블록을 자동 생성합니다.
- 응답
  - `{ "success": true, "isDummy": true, "focusBlocksCreated": 2, "created": [...] }`

### [POST] /api/automation/jira-sync

- 설명: Jira 마감일을 일정으로 동기화합니다.
- 응답
  - `{ "success": true, "isDummy": true, "summary": { "created": 1, "skipped": 2, "total": 3 }, "results": [...] }`

---

## 📎 내부 전용 API Appendix

### [POST] /api/internal/pod-d/meeting-refined

- 설명: 정제된 회의록을 Pod C 지식 저장소에 반영합니다.
- Body
  - `{
      "meetingLogId": "uuid",
      "title": "string",
      "summary": "string",
      "participants": ["string"],
      "actionItems": [{ "task": "string", "assignee": "string", "due_date": "string" }],
      "transcript": "string",
      "updatedAt": "timestamp"
    }`
- 응답
  - `{ "success": true }`

### [POST] /api/internal/pod-e/thread-captured

- 설명: 채팅 스레드 캡처 결과를 저장하고 지식 저장소에 반영합니다.

### [POST] /api/internal/pod-e/channels/[id]/briefing

- 설명: 시스템 브리핑 메시지를 특정 채널에 생성합니다.

### [PATCH] /api/documents/[id]/status

- 상태
  - `410 Gone`
- 설명
  - 직접 상태 변경 API는 더 이상 지원되지 않습니다. `/submit` 또는 `/approval` 사용

---

## 💡 통합 개발 메모

- Pod B 일정 생성/수정/삭제는 Pod C 지식 저장소와 연계됩니다.
- Pod D 회의록 정제 결과도 내부 API를 통해 Pod C와 연계됩니다.
- Chatter 스레드 캡처 역시 Pod C 지식 저장소로 적재됩니다.
- 운영 배포 전에는 `/api/admin/sync-knowledge` 와 같은 관리성 엔드포인트에 권한 보호를 추가하는 것이 권장됩니다.
