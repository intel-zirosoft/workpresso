# Pod B: Schedules System Skill (관심사 분리 버전)

## 🎯 도메인 범위
- **데이터 모델**: `packages/db/schema.db` 내 `schedules` 테이블 관리 (일정 제목, 시작/종료 시간, 소유자)
- **핵심 기능**: 개인/부서 일정 캘린더 관리, 시간대(Timezone) 기반 조회 및 등록
- **상태 관리**: `deleted_at` 필드를 통한 Soft Delete 처리로 데이터 이력 보존

## 🛠 데이터 무결성 및 보안
- **Audit**: 삭제된 일정 복구가 가능하도록 Soft Delete 정책을 준수합니다.
- **시간대 관리**: 모든 데이터는 `TIMESTAMP WITH TIME ZONE` 형식을 엄수하여 데이터 일관성을 유지합니다.

## 🔌 인터페이스 (외부 연동 규격)
- **표준 API 노출**: 외부(AI 에이전트 등)에서 일정을 직접 제어할 수 있는 표준 CRUD 엔드포인트를 제공합니다.
  - **Input**: `{ user_id: UUID, title: string, start_time: ISO8601, end_time: ISO8601 }`
- **외부 의존성 차단**: Pod B 개발자는 회의록(`meeting_logs`)이나 벡터 데이터베이스에 직접 접근하거나 관련 비즈니스 로직을 포함해서는 안 됩니다.

## 📋 완료 조건
- 외부에서 온 JSON 요청으로 일정이 중복 없이 정확한 시간대에 등록되는가?
- 부서별 필터링 조회 시 `deleted_at`이 있는 데이터가 제외되는가?
