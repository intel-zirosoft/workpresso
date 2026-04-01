# Daily Report — 2026-03-31

## 요약
- Pod-C 채팅 라우트를 OpenRouter 직접 호출 경로 중심으로 재정비하고, Preview 환경/스트리밍 이슈 대응을 보강했다.
- 웹 주요 탭(`/schedules`, `/documents`, `/chatter`)의 초기 진입 성능을 개선하고, 헤더/사이드바 사용자 조회를 공통 캐시로 통합했다.
- 다크 테마 하드코딩 색상을 토큰 기반으로 정리한 변경을 병합했다.
- `apps/mobile` 기준 Expo Go용 모바일 MVP 하네스를 구축하고 WebView, 브리지, 딥링크, 로그인 이동 흐름을 안정화했다.
- 모바일 전환 계획/하네스 설계/시연 체크리스트/API 명세 확장 문서를 정리했다.

## 오늘 반영된 주요 변경

### 1. Pod-C 채팅 경로 안정화
- 관련 커밋:
  - `dba1a04` `fix: Preview 환경에서 채팅 스트림 오류 메시지 노출 강화`
  - `314e222` `fix: OpenRouter 채팅 경로를 비스트리밍 응답으로 우회`
  - `b2483dc` `fix: Pod-C 채팅을 OpenRouter 직접 호출 경로로 전환`
- 주요 내용:
  - Preview 환경에서 채팅 실패 원인을 더 드러나게 조정
  - 스트리밍 경로 문제를 줄이기 위해 비스트리밍 우회 적용
  - 채팅 API를 OpenRouter 직접 호출 경로 중심으로 재정리
- 영향 파일:
  - `apps/web/src/app/api/chat/route.ts`
  - `apps/web/src/app/api/chat/route.test.ts`
  - `apps/web/src/app/api/chat/chat-schedule.integration.test.ts`

### 2. 웹 UX/성능 개선
- 관련 커밋:
  - `84ea89e` `perf: 주요 탭 진입 지연 로드와 로딩 UI 적용`
  - `0393ac7` `perf: 헤더와 사이드바 사용자 조회를 공통 캐시로 통합`
  - `51a6df8` `perf: 문서 워크스페이스 초기 로드 비용 축소`
  - `d000063` `fix: 문서 탭 선로딩과 테스트 타입 오류 수정`
- 주요 내용:
  - `/schedules`, `/documents`, `/chatter`에 route-level loading UI 추가
  - 무거운 워크스페이스/달력 컴포넌트를 지연 로드하도록 분리
  - 헤더/사이드바의 사용자 정보 조회를 `/api/users/me` + 공통 React Query 캐시로 통합
  - 문서 탭 선로딩과 `viewerApprovalStatus` 관련 테스트 타입 오류 보정
- 참고 문서:
  - `docs/operations/performance-improvements-20260331.md`

### 3. 다크 테마 토큰 정리 및 병합
- 관련 커밋:
  - `ba7ffc3` `fix(theme): replace hardcoded dark-mode colors with tokens`
  - `1c261a6` `Merge pull request #73 from intel-zirosoft/Dark-Theme`
- 주요 내용:
  - 다크 모드 하드코딩 색상을 토큰 기반으로 치환
  - 스케줄/설정/문서/채터/음성 관련 UI와 공통 스타일을 함께 정리
  - `globals.css`, `tailwind.config.js` 중심의 테마 일관성 강화

### 4. 모바일 MVP 하네스 구축 및 안정화
- 관련 커밋:
  - `c6255cd` `feat(mobile): Expo Go용 WebView UX 안정화와 안드로이드 딥링크 기본 처리 추가`
  - `a0a08f2` `feat(mobile): 브리지 검증 로그와 개발용 확인 패널 추가`
  - `190dcff` `fix(mobile): 로그인 후 기능 미동작 원인 진단 가시성 추가`
  - `11c22af` `fix(mobile): 로그인 버튼 이동 시 WebView 라우트 전환 처리 보강`
  - `1f0de7a` `docs(mobile): 안드로이드 Expo Go 시연 체크리스트 정리`
- 주요 내용:
  - `apps/mobile`에 Expo Router 탭 구조와 WebView 하네스 기본 뼈대 추가
  - Android 기준 외부 링크/딥링크/뒤로가기/새로고침 흐름 보강
  - 웹↔앱 브리지 타입/핸들러/주입 스크립트 구성
  - 개발용 브리지 확인 패널과 진단 로그 추가
  - 로그인 버튼 이동 시 WebView 라우트 전환 처리 개선
- 관련 문서:
  - `apps/mobile/README.md`
  - `docs/specs/Mobile_App_MVP_Demo_Checklist.md`

### 5. 오늘 작성/확장한 문서 작업
- 커밋 반영 문서:
  - `docs/operations/performance-improvements-20260331.md`
  - `docs/specs/Mobile_App_MVP_Demo_Checklist.md`
- 현재 로컬에서 추가 작성 중인 문서:
  - `docs/specs/Mobile_App_Conversion_MVP_Deadline_Plan.md`
  - `docs/specs/Mobile_App_Harness_Adoption_Spec.md`
- 현재 로컬에서 대폭 확장 중인 문서:
  - `docs/api/Workpresso_API_명세서.md`
    - Draft 형식에서 현재 구현 기준의 Pod/API별 상세 명세로 확장 중

## 참고 커밋 목록
- `11c22af` fix(mobile): 로그인 버튼 이동 시 WebView 라우트 전환 처리 보강
- `190dcff` fix(mobile): 로그인 후 기능 미동작 원인 진단 가시성 추가
- `1f0de7a` docs(mobile): 안드로이드 Expo Go 시연 체크리스트 정리
- `a0a08f2` feat(mobile): 브리지 검증 로그와 개발용 확인 패널 추가
- `c6255cd` feat(mobile): Expo Go용 WebView UX 안정화와 안드로이드 딥링크 기본 처리 추가
- `d000063` fix: 문서 탭 선로딩과 테스트 타입 오류 수정
- `51a6df8` perf: 문서 워크스페이스 초기 로드 비용 축소
- `0393ac7` perf: 헤더와 사이드바 사용자 조회를 공통 캐시로 통합
- `84ea89e` perf: 주요 탭 진입 지연 로드와 로딩 UI 적용
- `ba7ffc3` fix(theme): replace hardcoded dark-mode colors with tokens
- `b2483dc` fix: Pod-C 채팅을 OpenRouter 직접 호출 경로로 전환
- `314e222` fix: OpenRouter 채팅 경로를 비스트리밍 응답으로 우회
- `dba1a04` fix: Preview 환경에서 채팅 스트림 오류 메시지 노출 강화

## 현재 로컬 상태
보고서 작성 직전 `git status --short` 기준:

- 수정 중:
  - `apps/web/src/components/shared/header.tsx`
  - `docs/api/Workpresso_API_명세서.md`
- 신규(미추적):
  - `docs/specs/Mobile_App_Conversion_MVP_Deadline_Plan.md`
  - `docs/specs/Mobile_App_Harness_Adoption_Spec.md`

## 메모
- 오늘 로그에는 `6b179d0` (`AA`)처럼 의미가 축약된 임시성 커밋도 포함되어 있어, 본 보고서에서는 작업 목적이 분명한 변경 위주로 재분류했다.
- 이 보고서는 2026년 3월 31일 커밋 로그, 현재 워킹트리 상태, 관련 문서를 기준으로 정리했으며 보고서 작성 과정에서 추가 빌드/테스트는 별도로 실행하지 않았다.
