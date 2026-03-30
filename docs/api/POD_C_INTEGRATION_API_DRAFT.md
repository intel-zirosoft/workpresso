# Pod-C 연동 내부 API 계약 초안 (Draft)

## 1. 문서 목적
이 문서는 Pod-C와 Pod-A/B/D/E 사이의 내부 연동 계약 초안입니다.

> 주의:
> - 이 문서는 **현재 구현된 외부 API 명세서**가 아니라, **Pod-C 중심 연동을 위한 내부 계약 제안서**입니다.
> - 현재 프로젝트에 일부 엔드포인트는 이미 존재하지만, 아래 문서에는 **제안(Proposed)** 항목도 포함됩니다.

---

## 2. 계약 원칙
1. 원본 데이터 생성/수정은 원본 Pod가 담당한다.
2. Pod-C는 검색용 인덱싱과 자연어 오케스트레이션을 담당한다.
3. 이벤트 적재는 idempotent 해야 한다.
4. 권한은 원본 Pod에서 다시 검증한다.
5. Pod-C는 확신이 낮은 경우 쓰기 API를 바로 호출하지 않고 재질문한다.

---

## 3. 공통 규약

### 인증
- 내부 서버 간 호출 또는 서버 액션 기반 호출
- 공개 API로 노출 시 서비스 토큰 또는 세션 기반 검증 필요

### 공통 헤더
- `Content-Type: application/json`
- `X-Request-Id: <uuid>`
- `X-Source-Pod: pod-a | pod-b | pod-c | pod-d | pod-e`

### 공통 응답 포맷
#### 성공
```json
{
  "ok": true,
  "data": {}
}
```

#### 실패
```json
{
  "ok": false,
  "message": "오류 메시지",
  "errors": []
}
```

### 멱등성 키 권장
- `source_type + source_id + updated_at`
- 또는 `event_id`

---

## 4. 현재 존재하는 주요 연동 지점

### 4.1 Pod-C 채팅
- **Current**: `POST /api/chat`
- 설명: RAG 기반 질의응답 및 향후 Tool Calling 확장 포인트

### 4.2 Pod-C 지식 동기화
- **Current**: `POST /api/admin/sync-knowledge`
- 설명: 로컬 지식 문서 동기화용. 향후 Pod별 지식 적재 라우트로 분리 가능

### 4.3 Pod-D 회의 요약
- **Current**: `POST /api/meetings/[id]/summary`
- 설명: 회의 내용을 요약하며 Pod-C 지식화와 연계 가능

---

## 5. Proposed: 공통 지식 적재 API

### [POST] /api/internal/knowledge/upsert
설명: Pod-A/B/D/E에서 생성되거나 확정된 업무 데이터를 Pod-C 검색 인덱스로 적재/갱신합니다.

#### Body
```json
{
  "sourceType": "DOCUMENTS",
  "sourceId": "uuid",
  "title": "2026년 2분기 협업 운영 계획",
  "content": "문서 전체 본문 또는 정제 텍스트",
  "metadata": {
    "status": "APPROVED",
    "department": "Product",
    "updated_at": "2026-03-30T09:00:00.000Z"
  }
}
```

#### sourceType enum
- `DOCUMENTS`
- `SCHEDULES`
- `MEETING_LOGS`
- `CHAT_THREADS` (선택 확장)

#### 응답
```json
{
  "ok": true,
  "data": {
    "sourceType": "DOCUMENTS",
    "sourceId": "uuid",
    "syncedAt": "2026-03-30T09:00:01.000Z"
  }
}
```

#### 비고
- 현재 코드상 내부 서비스 `upsertKnowledgeSource()`와 거의 동일한 역할
- 외부 엔드포인트화가 필요하면 이 계약을 기준으로 라우트 추가 가능

---

### [POST] /api/internal/knowledge/remove
설명: 원본이 삭제되거나 더 이상 공개 검색 대상이 아니면 Pod-C 인덱스에서 제거합니다.

#### Body
```json
{
  "sourceType": "DOCUMENTS",
  "sourceId": "uuid",
  "reason": "REOPENED"
}
```

#### 응답
```json
{
  "ok": true,
  "data": {
    "removed": true
  }
}
```

---

## 6. Pod-A → Pod-C 계약 초안

### 트리거
- 문서 최종 승인 시
- 승인 문서 재오픈/수정 시

### [POST] /api/internal/pod-a/document-approved
설명: 최종 승인된 문서를 Pod-C 인덱싱 대상으로 전달합니다.

#### Body
```json
{
  "documentId": "uuid",
  "title": "출장비 운영 정책",
  "content": "문서 본문",
  "status": "APPROVED",
  "authorId": "uuid",
  "finalApprovedAt": "2026-03-30T09:00:00.000Z",
  "updatedAt": "2026-03-30T09:00:00.000Z"
}
```

#### Pod-C 처리
- `sourceType=DOCUMENTS`
- 승인 상태 검증
- 기존 동일 문서 인덱스 upsert

### [POST] /api/internal/pod-a/document-reopened
설명: 승인 문서가 재오픈되어 공식 지식으로 유지되면 안 되는 경우 인덱스를 제거 또는 갱신합니다.

#### Body
```json
{
  "documentId": "uuid",
  "status": "DRAFT",
  "updatedAt": "2026-03-30T10:00:00.000Z"
}
```

---

## 7. Pod-B ↔ Pod-C 계약 초안

### 7.1 Pod-B → Pod-C 일정 인덱싱
### [POST] /api/internal/pod-b/schedule-upserted
설명: 생성/수정된 일정 메타데이터를 Pod-C에 적재합니다.

#### Body
```json
{
  "scheduleId": "uuid",
  "title": "디자인 리뷰",
  "startTime": "2026-03-31T05:00:00.000Z",
  "endTime": "2026-03-31T06:00:00.000Z",
  "type": "MEETING",
  "ownerId": "uuid",
  "updatedAt": "2026-03-30T09:00:00.000Z"
}
```

#### Pod-C 처리
- `buildScheduleKnowledgeContent()` 규격으로 텍스트화
- `sourceType=SCHEDULES`로 upsert

---

### 7.2 Pod-C → Pod-B 일정 생성 Tool Calling
### [POST] /api/schedules
설명: Pod-C가 자연어 해석 결과를 기반으로 호출하는 실제 생성 API

#### 권장 Tool Payload
```json
{
  "title": "디자인 리뷰",
  "start_time": "2026-03-31T05:00:00.000Z",
  "end_time": "2026-03-31T06:00:00.000Z",
  "description": "Pod-C가 회의 메모를 바탕으로 생성",
  "attendee_ids": ["uuid-1", "uuid-2"]
}
```

#### Tool Calling 규칙
- 시간 정보가 불충분하면 재질문
- 참석자 식별이 모호하면 후보 제시 후 확인
- 일정 생성 후 생성 결과와 링크를 사용자에게 반환

---

## 8. Pod-D → Pod-C 계약 초안

### [POST] /api/internal/pod-d/meeting-refined
설명: STT/정제 완료된 회의록을 Pod-C 검색 인덱스에 적재합니다.

#### Body
```json
{
  "meetingLogId": "uuid",
  "title": "주간 운영 회의",
  "summary": "장애 대응 프로세스 개선 논의",
  "participants": ["홍길동", "김영희"],
  "actionItems": [
    {
      "task": "장애 대응 체크리스트 개편",
      "assignee": "홍길동",
      "due_date": "2026-04-02"
    }
  ],
  "transcript": "오늘 회의 주제는...",
  "updatedAt": "2026-03-30T09:00:00.000Z"
}
```

#### Pod-C 처리
- `buildMeetingLogKnowledgeContent()` 형식으로 텍스트 구성
- `sourceType=MEETING_LOGS`로 upsert
- action items를 후속 Tool Calling 후보로 저장 가능

### 확장 제안
- `create_followup_schedule: true` 같은 플래그를 두지 말고,
- 먼저 Pod-C가 사용자에게 확인 질문을 한 뒤 Pod-B를 호출하는 흐름 권장

---

## 9. Pod-E ↔ Pod-C 계약 초안

### 9.1 Pod-E → Pod-C 채널 대화 요약 저장
### [POST] /api/internal/pod-e/thread-captured
설명: 중요한 스레드나 공유 대화를 Pod-C 검색 대상으로 저장합니다.

#### Body
```json
{
  "channelId": "uuid",
  "threadId": "uuid",
  "title": "런칭 일정 조정 논의",
  "summary": "디자인 QA와 배포 일정 조정 필요",
  "messages": [
    {
      "authorName": "홍길동",
      "content": "QA를 하루 더 확보해야 합니다."
    }
  ],
  "linkedObjects": [
    {
      "type": "SCHEDULE",
      "id": "uuid"
    }
  ],
  "updatedAt": "2026-03-30T09:00:00.000Z"
}
```

#### 비고
- Pod-E는 현재 문서/일정 링크 공유 구조가 있어, 향후 thread capture 확장이 자연스러움
- `CHAT_THREADS`는 선택적 sourceType으로 분리 가능

---

### 9.2 Pod-C → Pod-E 채널 브리핑 전송
### [POST] /api/chatter/channels/[id]/messages
설명: Pod-C가 요약 결과나 브리핑을 특정 채널에 시스템 메시지로 남깁니다.

#### Body
```json
{
  "content": "어제 회의 요약입니다...",
  "messageType": "SYSTEM"
}
```

#### 비고
- 실제 라우트 명은 현재 구현 상태에 맞춰 조정 필요
- 현재 Pod-E는 채널 메시지 생성 서비스가 존재하므로 이를 API화하는 방향 권장

---

## 10. Pod-C 브리핑/질의응답 응답 형식 권장

### [POST] /api/chat
Pod-C 응답 시 단순 텍스트만 주지 말고, 아래 메타를 함께 다루는 방향 권장

#### 권장 응답 메타
```json
{
  "answer": "지난주 운영회의에서 장애 대응 담당은 홍길동입니다.",
  "sources": [
    {
      "sourceType": "MEETING_LOGS",
      "sourceId": "uuid",
      "title": "주간 운영 회의"
    }
  ],
  "suggestedActions": [
    {
      "type": "CREATE_SCHEDULE",
      "label": "후속 일정 만들기"
    }
  ]
}
```

---

## 11. 예외 처리 가이드
- **문서가 미승인 상태**: Pod-C 인덱싱 거부
- **회의록 정제가 실패**: transcript만 임시 적재하거나 재시도 큐 등록
- **일정 생성 정보 부족**: Pod-C가 재질문 후 Tool Calling
- **권한 없는 채널/문서 참조**: 원본 Pod 권한 오류를 그대로 반환
- **중복 이벤트 수신**: `source_type + source_id` upsert로 흡수

---

## 12. 우선 구현 순서 제안
1. Pod-D `meeting-refined` → Pod-C upsert 계약 고정
2. Pod-B Tool Calling payload 확정
3. Pod-A 승인 문서 인덱싱 계약 고정
4. Pod-E thread capture / 브리핑 API 확장

---

## 13. 결론
Pod-C 연동의 핵심은,
- 원본 Pod의 권한과 상태를 존중하고
- Pod-C는 검색과 오케스트레이션에 집중하며
- 이벤트 적재와 Tool Calling을 분리하는 것입니다.

이 초안을 기준으로 Backend 단계에서는 실제 내부 Route/Service 계약으로 구체화하고,
Frontend 단계에서는 Pod-C 대화 UI에서 "요약 → 제안 → 실행" 경험을 설계하는 것이 적절합니다.

---
**문서 성격**: Internal API Contract Draft  
**다음 담당 권장**: Backend Developer
