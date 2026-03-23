# DB 설계서 (최종본)

본 문서는 IT 용어 사전 및 그룹웨어 시스템의 데이터 구조를 정의하며, 시스템 전반에 적용되는 공통 규격과 테이블별 상세 설계를 포함합니다.

---

## 0. 공통 시스템 규격 (System Global)

모든 테이블은 별도의 명시가 없더라도 데이터의 투명한 관리와 추적을 위해 다음 **공통 시스템 컬럼**을 포함합니다.

### [공통 시스템 컬럼]
- `id`: UUID (Primary Key, 자동 생성)
- `created_at`: TIMESTAMP (생성 시간, Default now())
- `updated_at`: TIMESTAMP (수정 시간, Default now(), 트리거 자동 갱신)
- `deleted_at`: TIMESTAMP (소프트 삭제 시간, NULL이면 활성 데이터)

### [공통 ENUM 타입]
- `USER_STATUS`: `ACTIVE` (활성), `VACATION` (휴가), `MEETING` (회의), `OFFLINE` (오프라인)
- `DOC_STATUS`: `DRAFT` (임시), `PENDING` (결재대기), `APPROVED` (승인), `REJECTED` (반려)
- `SOURCE_TYPE`: `DOCUMENTS` (결재문서), `MEETING_LOGS` (회의록)

---

## 1. 기반 시스템 (Foundation)

### **Table:** `users` (사용자 및 조직도)
> 시스템 공통 컬럼 포함

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `name` | VARCHAR | 사용자 이름 | 필수 |
| `department` | VARCHAR | 소속 부서 | AI 검색/필터링용 |
| `status` | USER_STATUS | 현재 상태 | ENUM 사용 |

---

## 2. 업무 코어 시스템 (Pod A & B)

### **Table:** `documents` (결재 문서)
> 시스템 공통 컬럼 포함

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `author_id` | UUID | 문서 작성자 | `users.id` FK |
| `title` | VARCHAR | 기안서 제목 |  |
| `content` | TEXT | 마크다운 본문 |  |
| `status` | DOC_STATUS | 결재 상태 | ENUM 사용 |

### **Table:** `schedules` (업무 일정)
> 시스템 공통 컬럼 포함

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `user_id` | UUID | 일정 소유자 | `users.id` FK |
| `title` | VARCHAR | 일정 제목 |  |
| `start_time` | TIMESTAMP | 시작 시간 | AI 제어 가능 |
| `end_time` | TIMESTAMP | 종료 시간 |  |

---

## 3. AI 및 지식망 시스템 (Pod C & D)

### **Table:** `meeting_logs` (회의록)
> 시스템 공통 컬럼 포함

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `owner_id` | UUID | 회의 주최자 | `users.id` FK |
| `audio_url` | VARCHAR | 음성 파일 경로 | 스토리지 링크 |
| `stt_text` | TEXT | 변환 텍스트 | Whisper 결과 |

### **Table:** `knowledge_vectors` (지식 지도)
> **시스템 공통 컬럼 제외 사유:** 원본 데이터 삭제 시 Hard Delete를 통한 저장 공간 최적화 권장. `deleted_at`을 포함하지 않음.

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `id` | UUID | 벡터 고유 식별자 | PK |
| `source_type` | SOURCE_TYPE | 데이터 출처 | ENUM 사용 |
| `source_id` | UUID | 원본 데이터 ID | 다각형 참조 |
| `embedding` | VECTOR | 벡터 데이터 | OpenAI 1536 dim |
| `metadata` | JSONB | 검색 필터 데이터 | 부서, 날짜 등 |
| `created_at` | TIMESTAMP | 생성 시간 |  |
| `updated_at` | TIMESTAMP | 수정 시간 |  |

### **Table:** `workspace_extensions` (익스텐션 스토어)
> 시스템 공통 컬럼 포함 (설정값 복구 및 안전한 삭제 관리를 위해 `deleted_at` 유지)

| **컬럼명** | **타입** | **설명** | **비고** |
| --- | --- | --- | --- |
| `ext_name` | VARCHAR | 서비스 이름 | slack, jira 등 |
| `is_active` | BOOLEAN | 활성화 여부 |  |
| `config` | JSONB | 설정 정보 | API Key 등 |

---

## 설계 가이드라인
1. **데이터 무결성:** 모든 `status`와 `type`은 정의된 ENUM 내에서만 관리하여 코드 레벨의 오류를 방지합니다.
2. **이벤트 기반 동기화:** `knowledge_vectors`는 원본 테이블의 트리거 또는 Edge Functions를 통해 동기화하며, 원본이 소프트 삭제될 시 즉시 하드 삭제하여 검색 성능을 유지합니다.
3. **복구 중심 설계:** 설정 및 업무 핵심 데이터는 시스템 공통 컬럼을 통해 삭제 후에도 일정 기간 복구 가능한 상태를 유지합니다.
