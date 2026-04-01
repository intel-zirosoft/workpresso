# WorkPresso 광범위 명세 기반 테스트 케이스

작성일: 2026-04-01

## 1. 기준 문서

- `docs/specs/Settings_Feature_Spec.md`
- `docs/Theme-Preferences-Spec.md`
- `docs/Theme-Preferences-Tasks.md`
- `docs/api/Workpresso_API_명세서.md`
- `docs/api/POD_C_INTEGRATION_API_DRAFT.md`
- `docs/integrations/POD_C_GROUPWARE_INTEGRATION_GUIDE.md`
- `docs/integrations/INTEGRATION_ROADMAP_JIRA_SLACK.md`
- `docs/architecture/database/DB설계서_v20260330.md`
- `docs/architecture/database/DB설계서_최종본.md`
- `docs/pods/pod-a/Pod-A-Tasks.md`
- `docs/pods/pod-b/Pod-B-Tasks.md`
- `docs/pods/pod-c/Pod-C-Tasks.md`
- `docs/pods/pod-d/Pod-D-Tasks.md`
- `docs/guides/WORKPRESSO_INTERNAL_GUIDE.md`
- `docs/operations/KANBAN-DONE-LOG.md`
- `docs/operations/daily_report_20260331.md`

## 2. 이번 문서의 기준 정리

- 본 문서는 `docs` 폴더 문서를 기본 기준으로 삼되, 최신 사용자 지시가 문서보다 우선합니다.
- 따라서 Theme 기능은 과거 드롭다운 서술보다 최신 사용자 지시인 `헤더 토글 스위치 방식`을 현재 기준 명세로 반영합니다.
- 문서 간 충돌이 있는 항목은 `충돌/공백`으로 별도 표기하고, 테스트 케이스는 `현재 기준`, `구문서 기준`, `추론 기반`을 구분합니다.

## 3. 현재 확인된 충돌/공백

- Theme 문서 일부는 드롭다운 `Theme` 메뉴를 전제로 하지만, 최신 기준은 헤더 토글 스위치입니다.
- Settings 명세는 `TEAM_ADMIN` 이상이 `/settings/team`에 접근 가능해야 하나, 현재 구현은 `ORG_ADMIN` 이상만 허용하는 정황이 있습니다.
- Pod B 작업 문서는 일정 `PATCH`를 포함하지만 통합 API 문서는 `GET`, `POST`, `DELETE` 중심입니다.
- Pod C는 채팅 UI 미완료라고 적힌 문서가 있으나, 실제 제품 화면과 라우트는 존재합니다.
- Pod D는 히스토리, 단계 상태, 다운로드 규격이 작업 문서 기준으로는 상세하지만 통합 API 문서에는 충분히 드러나지 않습니다.
- Pod E는 전용 태스크 문서가 부족하고, 통합/로드맵 문서의 시나리오 기반 요구사항이 더 강합니다.

## 4. 커버리지 요약

| 도메인 | 기능 묶음 | 케이스 수 | 주 테스트 수준 | 비고 |
| --- | --- | --- | --- | --- |
| 공통 | 인증, 세션, 보호 라우트 | 8 | e2e, integration | 문서/설정/채팅 공통 진입 품질 |
| Theme | 토글, 저장, 시스템 연동, FOUC | 5 | e2e, manual | 최신 기준은 토글 스위치 |
| Settings | 프로필, RBAC, 조직/팀/연동/시스템 설정 | 15 | integration, e2e | 권한 검증 최우선 |
| Pod A | 문서 CRUD, 결재선, 승인/반려, Jira/Slack 후처리 | 18 | integration, e2e | 가장 높은 비즈니스 리스크 |
| Pod B | 일정 CRUD, 타임존, 근태 칸반, 자동화 | 10 | integration, e2e | 일정-상태 동기화 핵심 |
| Pod C | 채팅, 지식 동기화, 내부 계약, Tool Calling | 10 | contract, integration, e2e | 검색/실행 오케스트레이션 중심 |
| Pod D | 업로드, STT, 정제, 히스토리, Pod C 연동 | 9 | integration, e2e | 비동기 파이프라인 중심 |
| Pod E | 메신저/채널 공유/업무 객체 전환 | 6 | e2e, integration | 문서보다 시나리오 요구 비중 큼 |
| 전사 연동 | Slack/Jira 자동화, 브리핑, 리마인더 | 8 | integration, manual | 외부 연동/알림 품질 |
| 합계 |  | 89 |  |  |

## 5. 기능별 테스트 케이스

### 5.1 공통 인증 / 세션 / 보호 라우트

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | 명세 기반 | 로그인 페이지가 정상 렌더링된다 | 비로그인 상태 | `/login` 진입 | 이메일/비밀번호/로그인 버튼 표시 | 한글/레이아웃 깨짐 없이 렌더링 | e2e |
| AUTH-02 | 명세 기반 | 유효 계정으로 로그인한다 | 테스트 계정 준비 | 로그인 제출 | 홈 또는 기존 목적지로 이동 | 잘못된 비밀번호면 오류 메시지 | e2e |
| AUTH-03 | 명세 기반 | 비로그인 사용자의 보호 페이지 접근을 차단한다 | 비로그인 상태 | `/documents`, `/settings/profile`, `/chat` 진입 | 로그인 페이지로 이동 또는 접근 차단 | 일부 보호 페이지만 누락되면 실패 | e2e |
| AUTH-04 | 추론 기반 | 로그인 후 사용자 정보 캐시가 헤더/사이드바에 일관되게 표시된다 | 로그인 상태 | 홈 진입 | 이름, 이메일, 역할이 일관되게 노출 | 중복 fetch로 로딩 흔들림 과다 발생 | e2e |
| AUTH-05 | 명세 기반 | 로그아웃 시 세션이 종료된다 | 로그인 상태 | 로그아웃 클릭 | `/login`으로 이동하고 보호 페이지 재진입 차단 | 브라우저 뒤로가기로 보호 화면 잔존 금지 | e2e |
| AUTH-06 | 추론 기반 | 다중 역할 계정별 관리자 메뉴 노출이 분기된다 | `SUPER_ADMIN`, `ORG_ADMIN`, `USER` 계정 | 사이드바/헤더 확인 | 관리자 전용 메뉴 노출 규칙 준수 | UI 숨김만 되고 URL 직접 접근 허용 금지 | e2e |
| AUTH-07 | 문서 기반 | `.env` 및 시크릿은 클라이언트에 노출되지 않는다 | 브라우저 실행 | 네트워크/클라이언트 번들 확인 | 민감 키 미노출 | 오류 응답에 일부 키 노출 금지 | security review + e2e |
| AUTH-08 | 추론 기반 | 세션 만료 후 API는 인증 오류를 일관되게 반환한다 | 만료된 세션 | 보호 API 호출 | `401` 또는 로그인 유도 | 일부 API만 `500`이면 실패 | integration |

### 5.2 Theme Preferences

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| THEME-01 | 최신 기준 | 헤더 토글 스위치가 노출된다 | 로그인 상태 | 홈 헤더 확인 | 테마 토글 스위치와 현재 모드 레이블 노출 | 접근성 레이블 누락 금지 | e2e |
| THEME-02 | 명세 기반 | 토글 조작 시 전역 테마가 즉시 바뀐다 | 로그인 상태 | 토글 클릭 | `data-theme` 및 시각 테마 변경 | 클릭해도 값 미변경이면 실패 | e2e |
| THEME-03 | 명세 기반 | 선택값이 새로고침 후 유지된다 | 로그인 상태 | 토글 후 새로고침 | 마지막 선택값 유지 | localStorage 저장 누락 금지 | e2e |
| THEME-04 | 명세 기반 | 저장값이 없으면 기본 규칙을 따른다 | localStorage 제거 | 최초 진입 | 시스템값 또는 기본 정책에 맞게 초기화 | 초기 하이드레이션 깜빡임 최소화 | e2e + manual |
| THEME-05 | 운영 문서 기반 | 다크모드 토큰이 주요 표면/텍스트/경고 색상에 반영된다 | 다크 모드 상태 | 주요 화면 순회 | 텍스트 가독성과 의미색 유지 | 하드코딩 색상 잔존 시 실패 | manual + visual |

### 5.3 Settings / RBAC / 조직 관리

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SETTINGS-01 | 명세 기반 | `/settings`가 `/settings/profile`로 리다이렉트된다 | 로그인 상태 | `/settings` 진입 | `/settings/profile`로 이동 | 비로그인은 `/login`으로 이동 | e2e |
| SETTINGS-02 | 명세 기반 | `USER`가 본인 프로필을 조회/수정한다 | `USER` 계정 | 이름/부서 수정 후 저장 | 본인 프로필만 갱신 | 타 사용자 정보 수정 불가 | integration + e2e |
| SETTINGS-03 | 명세 기반 | 설정 사이드바가 역할별 허용 메뉴만 노출한다 | 각 역할 계정 | 설정 페이지 확인 | 허용 메뉴만 표시 | 메뉴 미노출과 URL 차단 둘 다 필요 | e2e |
| SETTINGS-04 | 명세 기반 | `TEAM_ADMIN`이 `/settings/team`에 접근한다 | `TEAM_ADMIN` 계정 | `/settings/team` 접근 | 팀 관리 화면 진입 | 차단되면 명세 불일치 | e2e |
| SETTINGS-05 | 명세 기반 | `ORG_ADMIN`이 `/settings/organization`에 접근한다 | `ORG_ADMIN` 계정 | `/settings/organization` 접근 | 조직 관리 화면 진입 | 일반 사용자 접근 차단 | e2e |
| SETTINGS-06 | 명세 기반 | `ORG_ADMIN`이 `/settings/integrations`에 접근한다 | `ORG_ADMIN` 계정 | `/settings/integrations` 접근 | Slack/Jira 연동 설정 화면 진입 | `USER` 차단 | e2e |
| SETTINGS-07 | 명세 기반 | `SUPER_ADMIN`만 `/settings/system`에 접근한다 | `SUPER_ADMIN`, `ORG_ADMIN` 계정 | `/settings/system` 접근 | `SUPER_ADMIN`만 성공 | 하위 권한은 리다이렉트 | e2e |
| SETTINGS-08 | 명세 기반 | 레거시 `department` 데이터를 팀으로 동기화한다 | team_id 없는 사용자 존재 | 동기화 액션 실행 | 팀 생성/연결 완료 | 중복 팀 생성 금지 | integration |
| SETTINGS-09 | 명세 기반 | 팀 생성이 가능하다 | `ORG_ADMIN` 이상 | 팀 이름/설명 입력 | 새 팀 생성 | 빈 이름 거절 | integration + e2e |
| SETTINGS-10 | 명세 기반 | 팀 수정이 가능하다 | 팀 존재 | 수정 액션 수행 | 정보 갱신 | 권한 없는 수정 금지 | integration |
| SETTINGS-11 | 명세 기반 | 팀 삭제 시 멤버는 `team_id=null`로 전환된다 | 팀과 멤버 존재 | 삭제 수행 | 팀 soft delete + 멤버 unassign | 멤버 hard delete 금지 | integration |
| SETTINGS-12 | 명세 기반 | 사용자 역할/팀 변경은 관리자만 가능하다 | 타깃 사용자 존재 | 역할/팀 수정 | DB 반영 성공 | 일반 사용자 시도 차단 | integration |
| SETTINGS-13 | 명세 기반 | Slack 설정 저장 및 활성 상태 계산이 일관된다 | 연동 페이지 접근 | webhook/bot token 저장 | 상태 카드 갱신 | 일부 필드만 있을 때 활성 규칙 확인 | integration + e2e |
| SETTINGS-14 | 명세 기반 | Jira 설정 저장 및 연결 테스트가 가능하다 | 연동 정보 준비 | 도메인/이메일/토큰 저장 및 테스트 | 정상 시 성공 상태 | 잘못된 자격 증명 오류 처리 | integration |
| SETTINGS-15 | 명세 기반 | 시스템 LLM 설정은 암호화 저장/요약 표시를 따른다 | `SUPER_ADMIN` 계정 | API 키/모델 저장 | 저장 후 요약/활성 상태 반영 | 클라이언트 원문 노출 금지 | integration + e2e |

### 5.4 Pod A Documents Workflow

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-01 | 명세 기반 | 초안 문서를 생성한다 | 유효 payload | `POST /api/documents` | 상태 `DRAFT`로 생성 | 결재선 0개 거절 | integration |
| DOC-02 | 명세 기반 | 작성자와 다른 `authorId` 생성 시도를 차단한다 | 로그인 사용자 A, 본문 B | 생성 요청 | 권한/검증 오류 | 데이터 미생성 | integration |
| DOC-03 | 명세 기반 | 결재자 중복과 CC 중복을 차단한다 | 중복 payload | 생성/수정 요청 | 입력 오류 | 순서 중복도 함께 거절 | integration |
| DOC-04 | 명세 기반 | `authored` scope가 작성 문서만 보여준다 | 데이터 준비 | 목록 조회 | 작성 문서만 노출 | 타 문서 노출 금지 | integration |
| DOC-05 | 명세 기반 | `approvals` scope가 현재 결재 문서만 보여준다 | 현재 단계 approver 준비 | 목록 조회 | 현재 결재 문서만 노출 | 다음 단계 approver 문서 노출 금지 | integration |
| DOC-06 | 명세 기반 | `cc` scope가 공람 문서만 보여준다 | 공람자 준비 | 목록 조회 | 공람 문서만 노출 | 비권한 문서 노출 금지 | integration |
| DOC-07 | 명세 기반 | 작성자/결재선/공람자만 상세 조회 가능하다 | 관련/비관련 사용자 | 상세 조회 | 허용 사용자만 성공 | 비관련 사용자는 404/차단 | integration |
| DOC-08 | 명세 기반 | `DRAFT`/`REJECTED`만 수정 가능하다 | 상태별 문서 | 수정 요청 | 허용 상태만 성공 | `PENDING`/`APPROVED` 수정 차단 | integration |
| DOC-09 | 명세 기반 | 제출 시 첫 단계만 `PENDING`, 나머지는 `WAITING`이 된다 | 다단계 문서 | `/submit` 호출 | 상태 전이 정확 | `submittedAt` 갱신 | integration |
| DOC-10 | 명세 기반 | 현재 `PENDING` approver만 승인/반려 가능하다 | 여러 역할 사용자 | `/approval` 호출 | 현재 approver만 성공 | 작성자/공람자/비관련 사용자 차단 | integration |
| DOC-11 | 명세 기반 | 중간 단계 승인 시 다음 단계가 활성화된다 | 3단계 문서 | 1단계 승인 | 2단계 `PENDING` | 재승인 요청 거절 | integration |
| DOC-12 | 명세 기반 | 마지막 단계 승인 시 문서가 `APPROVED`가 된다 | 마지막 단계 `PENDING` | 승인 수행 | `APPROVED`, `finalApprovedAt` 설정 | 승인 후 편집 차단 | integration |
| DOC-13 | 명세 기반 | 반려 시 문서가 `REJECTED`가 되고 재편집 가능해진다 | `PENDING` 문서 | 반려 수행 | 작성자 `canEdit=true` | 코멘트 저장 누락 금지 | integration |
| DOC-14 | 명세 기반 | 상세는 읽기 전용 모달로 열려야 한다 | 문서 존재 | 문서 선택 | 읽기 상세 모달 노출 | 인라인 편집 금지 | e2e |
| DOC-15 | 명세 기반 | 수정은 작성자 전용 편집 버튼으로만 진입한다 | 작성자/비작성자 | 상세 진입 | 작성자만 편집 버튼 노출 | URL/DOM 우회 방어 필요 | e2e |
| DOC-16 | 명세 기반 | 멀티 스텝 편집기에서 템플릿, 본문, 결재선/공람 데이터가 유지된다 | 새 문서 | 단계 이동 | 입력 데이터 보존 | 뒤로가기/닫기 시 유실 여부 추가 확인 | e2e |
| DOC-17 | 명세 기반 | 최종 승인 후 Jira 이슈 생성 버튼/위젯이 동작한다 | 승인 완료 문서 | `/jira` 호출 또는 버튼 클릭 | Jira 링크 저장/표시 | 중복 생성 금지 | integration + e2e |
| DOC-18 | 명세 기반 | Slack 알림은 문서 흐름을 막지 않고 soft-fail이어야 한다 | Slack 연동 on/off | 제출/승인/반려 | 본 처리 성공, 알림은 후처리 | Slack 실패가 문서 실패로 전파 금지 | integration |

### 5.5 Pod B Schedules / Teammates / Automation

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCHEDULE-01 | 명세 기반 | 특정 기간 일정 조회 | 일정 데이터 | `GET /api/schedules` | 기간 내 일정만 반환 | 빈 기간은 빈 배열 | integration |
| SCHEDULE-02 | 명세 기반 | 일정 생성 | 유효 제목/시각 | `POST /api/schedules` | 일정 생성 성공 | 종료가 시작보다 빠르면 거절 | integration |
| SCHEDULE-03 | 작업 문서 기반 | 일정 수정 | 기존 일정 | `PATCH` 또는 수정 UI | 수정 반영 | 문서/API 계약 불일치 확인 필요 | integration |
| SCHEDULE-04 | 명세 기반 | 일정 삭제 | 기존 일정 | `DELETE /api/schedules/[id]` | 삭제 반영 | 타인 일정 삭제 금지 | integration |
| SCHEDULE-05 | 작업 문서 기반 | UTC-로컬 시간 변환이 정확하다 | KST 일정 | 생성 후 조회 | 표시 시간이 일치 | 날짜 경계 오차 금지 | integration |
| SCHEDULE-06 | 작업 문서 기반 | 전체 사용자 일정/상태 조회가 가능하다 | 복수 사용자 | teammates 진입 | 팀 상태 보드 표시 | 인증 없는 접근 차단 | e2e |
| SCHEDULE-07 | 작업 문서 기반 | 시스템 스케줄 우선 정책으로 근태가 자동 이동한다 | 휴가/회의 일정 | 해당 시간 진입 | 칸반 상태 자동 변경 | 수동 변경과 충돌 시 시스템값 우선 | integration + e2e |
| SCHEDULE-08 | 로드맵 기반 | Daily 스마트 모닝 브리핑이 오늘 일정과 Jira 할 일을 요약한다 | Slack/Jira 연동 | 브리핑 트리거 | 개인화 요약 생성 | 연동 실패 시 graceful degradation | integration |
| SCHEDULE-09 | 로드맵 기반 | RSVP 상호작용이 캘린더와 동기화된다 | 이벤트 일정 | 참석/불참 응답 | 일정/응답 상태 갱신 | 중복 응답 처리 규칙 필요 | integration |
| SCHEDULE-10 | 로드맵 기반 | Jira due date가 캘린더에 블록으로 표시된다 | Jira 이슈 존재 | 동기화 실행 | 일정 블록 생성/갱신 | 중복 생성 방지 | integration |

### 5.6 Pod C Chat / Knowledge / Tool Calling

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CHAT-01 | 명세 기반 | `/api/chat` 스트리밍 응답 | 유효 messages | 채팅 요청 | 스트리밍 텍스트 응답 | 빈 요청 거절 | contract + e2e |
| CHAT-02 | 명세 기반 | 채팅 입력 UI와 응답 영역 표시 | 로그인 사용자 | `/chat` 진입 | 입력창과 응답 컨테이너 렌더링 | 영구 로딩 금지 | e2e |
| CHAT-03 | 명세 기반 | 로컬 지식 동기화 API가 벡터를 업서트한다 | 지식 문서 | `/api/admin/sync-knowledge` | 신규/변경 문서 반영 | 중복 적재 방지 | integration |
| CHAT-04 | 내부 계약 기반 | Pod A 승인 문서를 Pod C 인덱싱 대상으로 적재한다 | 승인 문서 | 내부 upsert | `DOCUMENTS` source 반영 | 미승인 문서 적재 금지 | integration |
| CHAT-05 | 내부 계약 기반 | Pod D 회의록을 Pod C 인덱싱 대상으로 적재한다 | 정제 완료 회의록 | 내부 upsert | `MEETING_LOGS` source 반영 | stale vector 정리 필요 | integration |
| CHAT-06 | 명세 기반 | Tool Calling 전 시간 정보가 불충분하면 재질문한다 | 모호한 일정 요청 | 채팅 요청 | 즉시 생성 대신 질문 | 추정 생성 금지 | integration |
| CHAT-07 | 내부 계약 기반 | 내부 API는 공통 헤더/응답 포맷을 따른다 | 내부 요청 | 계약 검증 | `{ok,data}` 또는 `{ok:false,message}` 형식 | 헤더 누락 처리 규칙 필요 | contract |
| CHAT-08 | 명세 기반 | 권한 검증은 원본 Pod에서 최종 판단한다 | 제한 리소스 요청 | Pod C 통해 호출 | 원본 권한 기준 차단 | Pod C 우회 금지 | integration |
| CHAT-09 | 로드맵 기반 | Slack slash command가 WorkPresso 질의를 중계한다 | Slack 연동 | `/workpresso ...` 호출 | Slack 창에 답변 반환 | 권한 없는 질의 차단 | integration |
| CHAT-10 | 로드맵 기반 | 스레드 지식화가 대화를 문서 자산으로 전환한다 | Slack thread | 저장 액션 | Canvas 문서 또는 지식 자산 생성 | 중복 저장 정책 필요 | integration |

### 5.7 Pod D Meeting Logs / Voice

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MEETING-01 | 명세 기반 | 음성 파일 업로드 | `.mp3` 또는 `.wav` | `/api/meetings/upload` | `id`, `audio_url` 반환 | 비지원 형식 거절 | integration |
| MEETING-02 | 명세 기반 | 상세 조회에 `stt_text`, `created_at` 제공 | 업로드 완료 회의 | `/api/meetings/[id]` | 전사 결과 표시 | 권한 없는 접근 차단 | integration |
| MEETING-03 | 작업 문서 기반 | 브라우저 녹음 제어 UI 동작 | 마이크 권한 | 녹음 시작/중지 | 상태와 버튼 일치 | 권한 거부 시 안내 | e2e |
| MEETING-04 | 작업 문서 기반 | 파형 시각화 렌더링 | 유효 오디오 | 상세 진입 | waveform 표시 | 짧은 파일에서도 크래시 금지 | e2e |
| MEETING-05 | 작업 문서 기반 | STT 실패/타임아웃 처리 | 실패 mock | 전사 요청 | 일관된 오류 안내 | 영구 대기 금지 | integration |
| MEETING-06 | 작업 문서 기반 | 정제 상태가 `UPLOADING -> TRANSCRIBING -> REFINING -> INDEXING` 순서로 전이 | 업로드 직후 회의 | 정제 수행 | 단계 상태 반영 | 중간 실패 지점 표시 | integration + e2e |
| MEETING-07 | 작업 문서 기반 | 정제 완료 시 제목/요약/참여자/액션아이템 생성 | 전사 완료 회의 | `/summary` 실행 | 구조화 데이터 저장 | JSON 파싱 실패 시 원문 보존 | integration |
| MEETING-08 | 작업 문서 기반 | 히스토리 목록과 상세가 `owner_id` 기준으로 격리된다 | 사용자 A/B 회의록 | 목록/상세 조회 | 본인 회의록만 표시 | 더미 ID 회귀 금지 | integration |
| MEETING-09 | 작업 문서 기반 | 마크다운 다운로드가 현재 상세와 일치한다 | 정제 완료 회의 | 다운로드 수행 | 파일 내용 일치 | 한글/줄바꿈 깨짐 방지 | e2e |

### 5.8 Pod E 메신저 / 협업 전환

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CHATTER-01 | 통합 가이드 기반 | 메신저/채널 공간 진입 | 로그인 사용자 | 메신저 열기 | 채널형 협업 UI 진입 | 초기 로딩 실패 시 fallback 필요 | e2e |
| CHATTER-02 | 통합 가이드 기반 | 대화 요약 요청 | 대화 스레드 존재 | 요약 액션 | 3줄 요약 또는 액션아이템 추출 | 빈 스레드 처리 필요 | e2e + integration |
| CHATTER-03 | 통합 가이드 기반 | 대화 기반 일정 생성 제안 | 일정성 대화 존재 | “일정 만들어줘” 요청 | Pod B 생성 플로우로 연결 | 시간 미상 시 재질문 | integration |
| CHATTER-04 | 통합 가이드 기반 | 대화 기반 결재 초안 생성 제안 | 문서성 대화 존재 | “결재 초안 만들어줘” 요청 | Pod A 초안 생성 보조 | 승인/최종상태 직접 변경 금지 | integration |
| CHATTER-05 | 로드맵 기반 | 대화 중 AI가 Jira 티켓 생성을 역제안한다 | 버그/이슈 논의 | 제안 트리거 | 사용 확인 후 Jira 생성 | 과잉 제안 억제 필요 | integration |
| CHATTER-06 | 통합 가이드 기반 | Pod E는 대화 공간이고 공식 원본 저장소를 대체하지 않는다 | 업무 객체 링크 공유 | 대화/공유 수행 | 원본 Pod 링크 중심으로 연결 | 대화 자체를 공식 원장처럼 취급 금지 | e2e + review |

### 5.9 전사 Slack / Jira / Automation

| ID | 근거 | 시나리오 | 준비 | 행동 | 기대 결과 | 실패/엣지 변형 | 권장 수준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTO-01 | 로드맵 기반 | Pod A 문서 상태 변경 Slack 알림 | Slack 연동 활성 | 제출/승인/반려 | 관련 채널/DM 알림 발송 | 발송 실패가 본 처리 차단 금지 | integration |
| AUTO-02 | daily report 기반 | Slack 인터랙션 대신 WorkPresso 링크 중심 플로우가 유지된다 | 알림 수신 | 링크 클릭 | WorkPresso에서 실제 승인/반려 처리 | Slack 직접 처리 정책과 혼선 금지 | integration + manual |
| AUTO-03 | 로드맵 기반 | PRD에서 Jira 에픽/스토리를 일괄 생성한다 | 규격 PRD 문서 | 생성 버튼 클릭 | Epic/Story 일괄 생성 및 링크 저장 | 일부 실패 시 요약 반환 | integration |
| AUTO-04 | 로드맵 기반 | 문서 내 Jira 라이브 위젯이 상태를 동기화한다 | Jira 링크 존재 | 문서 상세 조회 | 이슈 키/상태/담당자/링크 표시 | stale 상태 장기 잔존 금지 | integration + e2e |
| AUTO-05 | 로드맵 기반 | Pod B 데일리 브리핑이 Slack으로 전송된다 | 일정/Jira/Slack 준비 | 브리핑 실행 | AI 요약 메시지 전송 | 일정 없음/이슈 없음 graceful 처리 | integration |
| AUTO-06 | 로드맵 기반 | 회의 10분 전 리마인더가 Slack으로 전송된다 | 임박한 회의 | 리마인더 실행 | 맥락 포함 알림 전송 | 중복 발송 방지 | integration |
| AUTO-07 | 로드맵 기반 | Pod C Slash Command가 Slack 안에서 답한다 | Slack command 준비 | 명령 실행 | WorkPresso 데이터 기반 응답 | 권한/채널 범위 제어 필요 | integration |
| AUTO-08 | 내부 가이드 기반 | 외부 연동은 원본 Pod 책임 경계를 침범하지 않는다 | 연동 사용 | 생성/수정 시도 | 최종 쓰기와 권한 검증은 원본 Pod에서 수행 | Pod C/Slack이 상태 직접 변경 금지 | architecture review + integration |

## 6. 이번 회차 Playwright 실행 대상

- 아래 10개는 이번 회차 실제 브라우저 자동화로 검증했습니다.
- `TC-LOGIN-01`
- `TC-THEME-01`
- `TC-THEME-02`
- `TC-SETTINGS-01`
- `TC-SETTINGS-02`
- `TC-SETTINGS-03`
- `TC-SETTINGS-04`
- `TC-SETTINGS-05`
- `TC-DOCS-01`
- `TC-CHAT-01`

## 7. 후속 실행 우선순위

1. `SETTINGS-04` 실제 결함 여부 확인 및 수정
2. Pod A 상태 전이 음수 케이스 `DOC-09` ~ `DOC-18`
3. Pod B 타임존/근태 자동동기화 `SCHEDULE-03` ~ `SCHEDULE-10`
4. Pod C Tool Calling/지식 upsert `CHAT-03` ~ `CHAT-10`
5. Pod D 업로드-STT-정제 파이프라인 `MEETING-01` ~ `MEETING-09`
6. Slack/Jira 자동화 `AUTO-01` ~ `AUTO-08`
