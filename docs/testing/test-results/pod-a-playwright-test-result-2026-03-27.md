# Pod A Playwright 테스트 결과

## 실행 요약

- 대상 기능: Pod A 문서 워크플로우 UI/수동 QA 보강
- 실행 일시: 2026-03-27 16:34 ~ 16:49 (KST)
- 실행자: Codex
- 기준 문서: `docs/testing/test-case/pod-a-d-test-cases-2026-03-27.md`, `docs/pods/pod-a/Pod-A-Tasks.md`
- 실행 도구: `playwright` 스킬 기반 Playwright CLI, `playwright-test-result` 템플릿
- 전체 케이스 수: 8
- PASS: 4
- FAIL: 0
- BLOCKED: 0
- NOT RUN: 0
- PENDING REVIEW: 4
- 총평: 작성자 초안 편집, 결재 요청, 현재 결재자 승인, 공람자 scope 노출까지 주요 워크플로우는 실제 UI에서 확인되었습니다. 다만 거절 경로, 비권한 사용자 차단, Pod C sync 호출 여부, Markdown 단축키/미리보기/크게보기 전체 조합은 이번 회차에서 확정하지 못해 추가 검증이 필요합니다.

## 범위와 환경

- 브라우저: Playwright CLI + 번들 Chromium
- 디바이스 또는 해상도: 데스크톱 기본 viewport
- 대상 URL 또는 서비스: `http://127.0.0.1:3100/documents`
- 계정/권한:
  - 작성자: `admin@test.com`
  - 현재 결재자: `dev@test.com`
  - 공람자: `design@test.com`
- 테스트 데이터:
  - 기존 초안 문서 `테스트 문서 작성`
  - 결재 단계 `추가 단계 1`
  - 결재자 `개발자 · 개발팀`
  - 공람자 `디자이너 · 디자인팀`
- 특이 환경 조건:
  - 기본 Firefox 경로에서는 로그인 폼 이벤트가 안정적이지 않아 번들 Chromium 실행 경로를 지정해 계속 진행함
  - 로컬 Next dev 서버를 `127.0.0.1:3100`에서 실행해 테스트함

## 케이스별 결과

| ID | 시나리오 | 기대 결과 | 실제 결과 | 상태 | 근거 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| A-04 | `authored`, `approvals`, `cc` scope 분리 | 각 scope에서 해당 문서만 노출 | 작성자 `admin@test.com`의 `내 문서 Grid`, 결재자 `dev@test.com`의 `내 결재함`, 공람자 `design@test.com`의 `공람 문서`에서 동일 문서가 각각 노출됨 | PASS | `.playwright-cli/page-2026-03-27T07-42-49-369Z.yml`, `.playwright-cli/page-2026-03-27T07-45-55-414Z.yml`, `.playwright-cli/page-2026-03-27T07-48-59-892Z.yml` | 비권한 사용자 미검증 |
| A-05 | 작성자/현재 결재자/공람자 상세 접근 | 관련 사용자만 상세 조회 가능 | 작성자, 현재 결재자, 공람자 계정 모두 상세 모달 열람 확인 | PENDING REVIEW | `.playwright-cli/page-2026-03-27T07-39-33-122Z.yml`, `.playwright-cli/page-2026-03-27T07-46-14-742Z.yml`, `.playwright-cli/page-2026-03-27T07-49-18-194Z.yml` | unrelated 사용자 403/404 미검증 |
| A-06 | 초안 제출 시 결재 대기 전환 | 문서 `PENDING`, 1단계 `PENDING` | `결재 요청` 후 문서 상태 `결재 대기`, 현재 단계 `추가 단계 1`, 1단계 상태 `PENDING`으로 표시됨 | PASS | `.playwright-cli/page-2026-03-27T07-42-49-369Z.yml`, `.playwright-cli/page-2026-03-27T07-43-30-887Z.png` | 단일 결재 단계로 검증 |
| A-07 | 현재 단계 approver만 승인/반려 가능 | 현재 approver만 성공, 나머지는 거절 | 현재 approver인 `dev@test.com`에서 `승인`, `반려` 버튼 노출 확인 후 `승인` 성공 | PENDING REVIEW | `.playwright-cli/page-2026-03-27T07-46-14-742Z.yml`, `.playwright-cli/page-2026-03-27T07-46-42-206Z.png` | 작성자/공람자/비관련 사용자 거절은 미검증 |
| A-09 | 마지막 단계 승인 시 최종 승인 | 문서 `APPROVED`, 단계 `APPROVED` | `승인` 후 상세 모달에서 문서 상태 `승인 완료`, 단계 상태 `APPROVED`, 처리 시각 표시 확인 | PASS | `.playwright-cli/page-2026-03-27T07-46-52-617Z.yml`, `.playwright-cli/page-2026-03-27T07-47-12-558Z.png` | 단일 단계라 최종 승인 케이스로 판정 |
| A-11 | `DRAFT`만 편집 가능, `PENDING`/`APPROVED` 읽기 전용 | 허용 상태에서만 편집 진입 | `DRAFT` 상세에는 `편집` 버튼이 보였고, `PENDING` 제출 후 상세에는 편집 버튼이 사라졌으며, `APPROVED` 공람자 상세도 읽기 전용으로 표시됨 | PENDING REVIEW | `.playwright-cli/page-2026-03-27T07-39-33-122Z.yml`, `.playwright-cli/page-2026-03-27T07-42-49-369Z.yml`, `.playwright-cli/page-2026-03-27T07-49-18-194Z.yml` | `REJECTED` 상태와 API 우회 수정 미검증 |
| A-13 | 읽기 상세 모달과 작성자 전용 편집 진입 | 행 선택 시 읽기 모달, 작성자만 편집 진입 | 행 클릭 시 읽기 전용 상세 모달이 열렸고, 작성자 초안 상세에서만 `편집` 버튼이 노출됨 | PASS | `.playwright-cli/page-2026-03-27T07-39-33-122Z.yml`, `.playwright-cli/page-2026-03-27T07-40-11-104Z.yml` | 비작성자 URL/DOM 조작 미검증 |
| A-15 | 멀티 스텝 편집기 일부 동작 | 단계 이동 중 데이터 손실 없음 | 1단계 제목/본문에서 2단계 결재선/공람으로 이동 후 저장 시 데이터가 유지되고 상세 타임라인/공람 대상에 반영됨 | PENDING REVIEW | `.playwright-cli/page-2026-03-27T07-40-11-104Z.yml`, `.playwright-cli/page-2026-03-27T07-40-42-496Z.yml`, `.playwright-cli/page-2026-03-27T07-42-27-056Z.yml` | 템플릿, 미리보기, `크게보기`는 미검증 |

## 실패 및 차단 상세

- 이번 회차에서 `FAIL`, `BLOCKED`로 판정한 Pod A 케이스는 없었습니다.

## 리스크 및 추가 확인

- 이번 회차에서 남은 리스크:
  - `A-07`의 핵심 음수 케이스인 작성자, 공람자, unrelated 사용자 차단을 아직 실행하지 못했습니다.
  - `A-11`의 `REJECTED` 편집 가능 여부와 수정 API 우회 차단은 확인하지 못했습니다.
  - `A-12` Pod C knowledge sync 1회 호출 여부는 UI만으로 근거 확보가 부족합니다.
  - `A-14`, `A-15`의 Markdown 단축키, 미리보기 토글, `크게보기` 전체 조합은 별도 수동 QA가 더 필요합니다.
- 명세와 구현 불일치 의심:
  - Playwright CLI 기본 Firefox 경로에서는 로그인 폼 이벤트가 안정적으로 붙지 않아 Chromium 경로를 별도로 지정해야 했습니다. 브라우저 호환성 이슈인지 환경 특이점인지 추가 확인이 필요합니다.
- 추가 실행이 필요한 케이스:
  - A-01, A-02, A-03, A-08, A-10, A-12, A-14, A-16
  - unrelated 사용자 상세 접근 차단
  - 공람자 또는 작성자 승인/반려 우회 시도 차단
- 자동화 또는 데이터 보완 필요 사항:
  - 다단계 2스텝 이상 결재 문서를 별도 fixture로 준비하면 A-08 검증이 쉬워집니다.
  - Pod C sync mock/log를 노출하는 관찰 포인트가 있으면 A-12 확정 판정이 가능합니다.

## 증적 목록

- 스크린샷:
  - `.playwright-cli/page-2026-03-27T07-38-17-193Z.png`
  - `.playwright-cli/page-2026-03-27T07-39-48-646Z.png`
  - `.playwright-cli/page-2026-03-27T07-41-34-080Z.png`
  - `.playwright-cli/page-2026-03-27T07-42-37-570Z.png`
  - `.playwright-cli/page-2026-03-27T07-43-30-887Z.png`
  - `.playwright-cli/page-2026-03-27T07-46-42-206Z.png`
  - `.playwright-cli/page-2026-03-27T07-47-12-558Z.png`
  - `.playwright-cli/page-2026-03-27T07-48-25-643Z.png`
- Trace:
  - 별도 수집 안 함
- 콘솔 로그:
  - `.playwright-cli/console-2026-03-27T07-28-34-896Z.log`
  - `.playwright-cli/console-2026-03-27T07-34-41-342Z.log`
- 네트워크 로그:
  - `.playwright-cli/network-2026-03-27T07-30-16-115Z.log`
- 기타:
  - `.playwright-cli/page-2026-03-27T07-39-33-122Z.yml`
  - `.playwright-cli/page-2026-03-27T07-40-11-104Z.yml`
  - `.playwright-cli/page-2026-03-27T07-40-42-496Z.yml`
  - `.playwright-cli/page-2026-03-27T07-42-27-056Z.yml`
  - `.playwright-cli/page-2026-03-27T07-42-49-369Z.yml`
  - `.playwright-cli/page-2026-03-27T07-45-55-414Z.yml`
  - `.playwright-cli/page-2026-03-27T07-46-14-742Z.yml`
  - `.playwright-cli/page-2026-03-27T07-46-52-617Z.yml`
  - `.playwright-cli/page-2026-03-27T07-48-59-892Z.yml`
  - `.playwright-cli/page-2026-03-27T07-49-18-194Z.yml`
