# Pod D: Meeting Logs System Skill (관심사 분리 버전)

## 🎯 도메인 범위
- **데이터 모델**: `packages/db/schema.db` 내 `meeting_logs` 테이블 관리 (오디오 URL, STT 결과 텍스트, 주최자)
- **핵심 기능**: 음성 파일 스토리지 관리, Whisper API 비동기 연동
- **상태 관리**: 삭제된 회의록 보존을 위해 `deleted_at` 필드를 활용한 Soft Delete 정책을 준수합니다.

## 🛠 데이터 무결성 및 보안
- **Audit**: 모든 조회 시 `deleted_at IS NULL` 필터를 기본 적용합니다.
- **오디오 보호**: `owner_id`와 요청자의 ID를 비교하여 오디오 URL 접근을 엄격히 제한합니다.

## 🔌 인터페이스 (외부 연동 규격)
- **이벤트 발행**: 텍스트 변환(STT)이 완료될 때, `TRANSCRIPTION_FINISHED` 이벤트를 송출합니다.
  - **Payload**: `{ source_id: UUID, stt_text: string, owner_id: UUID, timestamp: ISO8601 }`
- **외부 의존성 차단**: Pod D 개발자는 벡터 데이터베이스(`knowledge_vectors`)나 결재 문서 시스템의 내부 로직에 직접 접근하거나 수정해서는 안 됩니다.

## 📋 완료 조건
- 음성 파일 업로드 및 STT 변환 완료 후 정상적인 페이로드로 이벤트가 나가는가?
- 비주최자의 오디오 접근이 403 에러로 차단되는가?
