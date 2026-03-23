# Pod A: Documents System Skill (관심사 분리 버전)

## 🎯 도메인 범위
- **데이터 모델**: `packages/db/schema.db` 내 `documents` 테이블 관리 (기안서 제목, 본문, 작성자, 상태)
- **핵심 타입**: `DOC_STATUS` ENUM 기반의 상태 전이 제어 (DRAFT, PENDING, APPROVED, REJECTED)
- **핵심 기능**: 마크다운 기반 문서 작성, 결재 승인/반려 로직 처리

## 🛠 데이터 무결성 및 보안
- **Audit**: 모든 조회 시 `deleted_at IS NULL` 필터를 기본 적용하여 Soft Delete 정책을 준수합니다.
- **권한**: 문서 수정/삭제 요청 시 `author_id`와 요청자의 ID 일치 여부를 반드시 검증합니다.

## 🔌 인터페이스 (외부 연동 규격)
- **이벤트 발행**: 문서 상태가 `APPROVED`로 변경될 때, `DOCUMENT_APPROVED` 이벤트를 시스템 버스(또는 Edge Function)로 송출합니다.
  - **Payload**: `{ source_id: UUID, title: string, content: string, author_id: UUID, timestamp: ISO8601 }`
- **외부 의존성 차단**: Pod A 개발자는 벡터 데이터베이스(`knowledge_vectors`)나 AI 처리 로직에 직접 접근하거나 해당 테이블을 수정해서는 안 됩니다.

## 📋 완료 조건
- 결재 승인 시 정의된 표준 페이로드로 이벤트가 정상 발행되는가?
- 본인이 아닌 사용자의 수정 시도가 차단되는가?
