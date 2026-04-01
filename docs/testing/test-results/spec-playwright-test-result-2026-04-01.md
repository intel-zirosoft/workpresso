# WorkPresso 명세 기반 Playwright 테스트 결과

## 실행 요약

- 대상 기능: Theme Preferences, Settings/RBAC, 문서 메인 UI, 채팅 진입
- 실행 일시: 2026-04-01
- 실행자: Codex
- 기준 문서:
  - `docs/testing/test-case/spec-based-test-cases-2026-04-01.md`
  - `docs/specs/Settings_Feature_Spec.md`
  - `docs/Theme-Preferences-Spec.md`
  - `docs/api/Workpresso_API_명세서.md`
  - `docs/api/POD_C_INTEGRATION_API_DRAFT.md`
  - `docs/integrations/POD_C_GROUPWARE_INTEGRATION_GUIDE.md`
- 실행 도구:
  - Playwright 기반 로컬 Chromium 자동화
  - 결과 산출: `playwright-test-result` 기준 정리
- 명세 기반 전체 케이스 수: 89
- 이번 회차 실행 케이스 수: 10
- PASS: 9
- FAIL: 1
- BLOCKED: 0
- NOT RUN: 0
- PENDING REVIEW: 0
- 총평:
  - 설정 라우팅과 상위 권한 접근 제어는 대체로 명세와 일치했습니다.
  - 최신 기준의 테마 토글 스위치 동작과 저장 유지 동작은 정상 확인되었습니다.
  - `TEAM_ADMIN`의 팀 관리 접근 권한은 여전히 명세와 실제 구현이 불일치했습니다.
  - 스크린샷의 한글 깨짐은 초기 실행에서 재현되었고, 폰트 fallback 보강 후 재실행한 최종 증적에서는 정상화되었습니다.

## 범위와 환경

- 브라우저: Playwright Chromium (headless)
- 디바이스 또는 해상도: 1440 x 1024 데스크톱 viewport
- 대상 URL 또는 서비스: `http://127.0.0.1:3100`
- 계정/권한:
  - `admin@test.com` / `SUPER_ADMIN`
  - `dev@test.com` / `ORG_ADMIN`
  - `design@test.com` / `TEAM_ADMIN`
  - `plan@test.com` / `USER`
- 테스트 데이터:
  - 테스트 계정 role을 명세 검증용으로 정렬
- 특이 환경 조건:
  - 로컬 `Next.js dev server`를 `127.0.0.1:3100`에서 직접 구동
  - Playwright CLI 세션 유지가 불안정해 로컬 Playwright 런타임 스크립트로 자동화를 수행
  - 첫 스크린샷 회차에서 한글 glyph 누락이 재현되어 `Noto Sans KR` fallback 보강 후 재실행

## 케이스별 결과

| ID | 시나리오 | 기대 결과 | 실제 결과 | 상태 | 근거 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| TC-LOGIN-01 | 로그인 후 홈 진입 | 로그인 성공 후 홈 대시보드 노출 | `admin@test.com` 로그인 후 홈 배너와 주요 위젯 노출 확인 | PASS | `output/playwright/spec-qa-20260401/TC-LOGIN-01-login.png`, `output/playwright/spec-qa-20260401/TC-LOGIN-01-home.png` | 최종 증적에서 한글 정상 |
| TC-THEME-01 | 헤더 테마 토글 노출 | 헤더에 테마 토글 스위치와 현재 모드 표시 | 토글 스위치와 접근성 레이블이 노출됨 | PASS | `output/playwright/spec-qa-20260401/TC-THEME-01-home.png` | 최신 사용자 지시 기준 |
| TC-THEME-02 | 테마 저장/유지 | 테마 변경 후 새로고침 시 마지막 선택 유지 | 스위치 토글 후 `data-theme`와 `localStorage(workpresso-theme)` 값이 유지됨 | PASS | `output/playwright/spec-qa-20260401/TC-THEME-02-after-toggle.png` | 현재 구현은 2-state 토글 |
| TC-SETTINGS-01 | `/settings` 기본 진입 | `/settings/profile`로 리다이렉트 | 리다이렉트와 프로필 화면 진입 확인 | PASS | `output/playwright/spec-qa-20260401/TC-SETTINGS-01-profile.png` |  |
| TC-SETTINGS-02 | `SUPER_ADMIN` 시스템 설정 접근 | `/settings/system` 접근 가능 | 시스템 설정 화면 정상 노출 | PASS | `output/playwright/spec-qa-20260401/TC-SETTINGS-02-system.png` |  |
| TC-SETTINGS-03 | `ORG_ADMIN` 조직 관리 접근, 시스템 설정 차단 | 조직 관리는 허용, 시스템 설정은 차단 | `/settings/organization` 접근 성공, `/settings/system`은 `/settings/profile`로 리다이렉트 | PASS | `output/playwright/spec-qa-20260401/TC-SETTINGS-03-organization.png`, `output/playwright/spec-qa-20260401/TC-SETTINGS-03-system-denied.png` |  |
| TC-SETTINGS-04 | `TEAM_ADMIN` 팀 관리 접근 | `/settings/team` 접근 가능 | 실제로 `/settings/profile`로 리다이렉트됨 | FAIL | `output/playwright/spec-qa-20260401/TC-SETTINGS-04-team-admin.png`, `output/playwright/spec-qa-20260401/TC-SETTINGS-04-failed.png` | 명세-구현 불일치 |
| TC-SETTINGS-05 | `USER` 연동 설정 차단 | `/settings/integrations` 접근 차단 | `/settings/profile`로 리다이렉트 확인 | PASS | `output/playwright/spec-qa-20260401/TC-SETTINGS-05-user-denied.png` |  |
| TC-DOCS-01 | 문서 메인 UI 계약 | `내 결재함`, `공람 문서` 등 주요 구획 표시 | 문서 화면 진입 후 주요 구획 텍스트 확인 | PASS | `output/playwright/spec-qa-20260401/TC-DOCS-01-documents.png` |  |
| TC-CHAT-01 | 채팅 화면 진입 | 입력창과 채팅 UI 렌더링 | `/chat` 진입 후 질문 입력창 노출 확인 | PASS | `output/playwright/spec-qa-20260401/TC-CHAT-01-chat.png` |  |

## 실패 및 차단 상세

### TC-SETTINGS-04

- 시나리오: `TEAM_ADMIN`의 팀 관리 페이지 접근
- 기대 결과:
  - 명세상 `TEAM_ADMIN` 이상은 `/settings/team` 접근 가능
- 실제 결과:
  - `design@test.com` 로그인 후 `/settings/team` 접근 시 `/settings/profile`로 리다이렉트됨
- 상태: FAIL
- 판정 사유:
  - 실행은 완료되었으나 명세 기대 결과와 달리 `TEAM_ADMIN`이 팀 관리 화면에 접근하지 못해 FAIL로 판정함.
- 추정 원인:
  - 서버 페이지 권한 분기에서 `TEAM_ADMIN`이 제외된 구현
- 재현 절차:
  - `design@test.com` 로그인 후 `/settings/team` 직접 접근
- 증적:
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-04-team-admin.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-04-failed.png`
- 후속 조치:
  - `/settings/team` 서버 권한 체크를 명세 기준(`TEAM_ADMIN` 이상)으로 수정 필요

## 리스크 및 추가 확인

- 이번 회차에서 남은 리스크:
  - Theme는 최신 기준상 토글 스위치 동작은 확인됐지만, 시스템 테마 추종/초기 깜빡임은 별도 시각 검증이 더 필요합니다.
  - Pod A는 메인 화면 구획만 확인했고, 제출/승인/반려 상태 전이와 음수 권한 케이스는 이번 회차 범위에 포함하지 않음
  - Pod B, Pod C Tool Calling, Pod D 비동기 파이프라인은 명세 기반 케이스는 작성했지만 이번 Playwright 회차에서는 미실행
- 명세와 구현 불일치 의심:
  - `TEAM_ADMIN`의 `/settings/team` 접근 권한
- 추가 실행이 필요한 케이스:
  - `THEME-04`, `THEME-05`
  - `DOC-04` ~ `DOC-09`
  - `SCHEDULE-01` ~ `SCHEDULE-05`
  - `CHAT-02` ~ `CHAT-05`
  - `MEETING-01` ~ `MEETING-05`
- 자동화 또는 데이터 보완 필요 사항:
  - Pod A 다단계 결재 fixture
  - Pod B 일정/근태 자동 동기화 fixture
  - Pod C 내부 지식 upsert 관찰 포인트
  - Pod D 업로드용 샘플 오디오와 정제 결과 fixture

## 증적 목록

- 스크린샷:
  - `output/playwright/spec-qa-20260401/TC-LOGIN-01-login.png`
  - `output/playwright/spec-qa-20260401/TC-LOGIN-01-home.png`
  - `output/playwright/spec-qa-20260401/TC-THEME-01-home.png`
  - `output/playwright/spec-qa-20260401/TC-THEME-02-after-toggle.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-01-profile.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-02-system.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-03-organization.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-03-system-denied.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-04-team-admin.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-04-failed.png`
  - `output/playwright/spec-qa-20260401/TC-SETTINGS-05-user-denied.png`
  - `output/playwright/spec-qa-20260401/TC-DOCS-01-documents.png`
  - `output/playwright/spec-qa-20260401/TC-CHAT-01-chat.png`
- Trace:
  - 별도 수집 안 함
- 콘솔 로그:
  - 이번 최종 재실행 기준 치명적 콘솔 오류는 결과 판정에 반영되지 않음
- 네트워크 로그:
  - 별도 수집 안 함
- 기타:
  - `output/playwright/spec-qa-20260401/spec-qa-results.json`
  - `output/playwright/spec-qa-20260401/run-spec-qa.js`
