# Pod C: AI & Knowledge Vector Skill (관심사 분리 버전)

## 🎯 도메인 범위
- **데이터 모델**: `packages/db/schema.db` 내 `knowledge_vectors` 테이블 관리 (벡터 데이터, 메타데이터, 다각형 참조 ID)
- **핵심 타입**: `SOURCE_TYPE` (DOCUMENTS, MEETING_LOGS)에 따른 데이터 분류
- **핵심 기능**: 텍스트 데이터의 벡터화, HNSW 기반 유사도 검색, 브릿지 설명 프롬프트 생성
- **상태 관리**: 원본 데이터 소멸 시 하드 삭제 정책을 유지하여 저장 공간을 최적화합니다.

## 🛠 데이터 무결성 및 보안
- **Audit**: 벡터 데이터는 `deleted_at`을 지원하지 않으며, 원본의 무결성에 종속됩니다.
- **임베딩 규격**: `text-embedding-3-small` (1536 dim) 모델을 사용하여 데이터를 균질화합니다.

## 🔌 인터페이스 (외부 연동 규격)
- **데이터 소비 (Ingest)**: 외부(`DOCUMENTS` 또는 `MEETING_LOGS`)로부터 텍스트와 원본 ID가 포함된 데이터를 수신하여 비동기 처리합니다.
  - **Payload**: `{ source_id: UUID, source_type: SOURCE_TYPE, content: string }`
- **검색 API 노출**: 질문과 직군 정보를 수신하여 검색 결과 및 브릿지 설명을 반환합니다.
- **외부 의존성 차단**: Pod C 개발자는 원본 테이블(`documents`, `meeting_logs`)의 본문 내용을 수정하거나 해당 비즈니스 로직을 변경해서는 안 됩니다.

## 📋 완료 조건
- 수신된 데이터가 1536차원의 벡터로 정상 저장되는가?
- 검색 결과가 타 직군 정보와 결합하여 적절한 비유로 반환되는가?
