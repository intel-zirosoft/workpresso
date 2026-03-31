# Pod B: Schedules System (업무 및 일정 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod B의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 캘린더 뷰 및 일정 CRUD

**목표:** 개인 일정 관리를 위한 캘린더 인터페이스 및 데이터 처리

- [x] **DB/Schema**: `packages/db/schema.db`의 `schedules` 테이블 스키마 확인 및 Zod 스키마 정의
- [x] **Backend (API)**: 일정 생성(POST), 조회(GET), 수정(PATCH), 삭제(DELETE) API 엔드포인트 구현
- [x] **Data Processing**: 서버(UTC)와 클라이언트(Local Timezone) 간의 시간 변환 로직 구현 (`date-fns` 활용)
- [x] **Frontend (UI)**: 캘린더 뷰 컴포넌트 렌더링 (`shadcn/ui`의 `react-day-picker` 활용)
- [x] **Frontend (UI)**: 일정 등록/수정 모달 폼 및 캘린더 내 일정 표시 마크업 구현
- [x] **Security**: 사용자가 본인의 일정만 조회 및 수정할 수 있도록 엄격한 RLS 정책 적용
- [x] **Git**: 모든 변경사항 `feat/pod-b-schedules` 브랜치에 푸시 완료

## 🧑‍💻 Part 2: 근태 상태/칸반 UI 및 외부 연동

**목표:** 팀원의 현재 상태(근태)를 시각화하고 타 파드와의 API 연동점 제공

- [x] **DB/Schema**: `schedules` 테이블에 `type` 컬럼 추가 및 `users.status` 연동 로직 설계
- [x] **Security (RLS)**: 팀원들의 일정을 서로 볼 수 있도록 `SELECT` 정책을 '전체 인증 유저'로 확장
- [x] **Backend (API)**: 전체 사용자의 일정 및 근태 상태 조회/변경 API 구현
- [x] **Frontend (UI)**: **Teammates 섹션** 내 근태 상태 관리용 칸반(Kanban) 보드 구현
- [x] **Frontend (State)**: 칸반 보드 내 드래그 앤 드롭 또는 클릭을 통한 상태 변경 및 API 연동
- [x] **Integration (Pod C API)**: Pod C(AI 에이전트) 연동 및 권한 설정

## 🧑‍💻 Part 3: 일정 커스텀 UI/UX 및 상태 자동 동기화

**목표:** 캘린더 컴포넌트를 고도화하고, 등록된 스케줄을 바탕으로 칸반 상태(근태)를 자동 연동하는 스마트 시스템 구축

- [x] **Status Sync (Automation)**: 스케줄 기반 자동 상태 동기화 구현 (`시스템 스케줄 우선` 정책)
  - 개인 캘린더에 휴가, 반차, 재택, 외근 등의 일정을 등록하면 해당 시간에 맞춰 Teammates 칸반 보드에서 카드가 해당 상태로 **자동 이동**
  - 사용자가 칸반에서 수동으로 조작하더라도, **시스템에 등록된 스케줄을 최우선으로 적용(Override)**하여 충돌 방지
- [x] **Calendar UI/UX (Library Integration)**: 대형 캘린더 라이브러리(FullCalendar) 도입 및 커스텀
  - 업무 일정 관리용 메인 화면의 달력(Calendar) 크기를 화면 전체 크기로 확장 (1600px Wide)
  - [UI 개선] **지난 날짜**: 두꺼운 다크 그레이 마커 스트로크(Rounded ends) 적용 완료
  - [UI 개선] **일정 표기**: 일요일 빨간색 처리 및 오늘 날짜 선명한 블루 강조 적용
  - [UI 개선] **상호작용**: 다른 달의 날짜 클릭 시 자동으로 해당 월로 화면 전환 기능 구현

## 🧑‍💻 Part 4: 코드 리뷰 피드백 반영 및 시스템 고도화

**목표:** 시니어 개발자의 코드 리뷰를 바탕으로 캘린더, 칸반, 문서 에디터의 코드 품질 및 성능 최적화

- [x] **Calendar (Refactoring)**: `calendarRef`를 활용한 오늘 날짜 자동 스크롤 로직 최적화 (DOM 직접 접근 제거)
- [x] **Kanban (Optimization)**: `useMemo` 기반 팀원 그룹화 로직 적용 및 `KanbanColumnId` 타입 안정성 강화
- [x] **Document Editor (UI/UX)**: 하드코딩된 색상값 제거(Semantic Color 적용) 및 아이콘 매핑 로직 외부 분리
- [x] **Common (Refactoring)**: 중복 클래스(`custom-scrollbar`) 및 유틸리티 점검 및 통합

## 🧑‍💻 Part 5: Jira & Slack 통합 (지능형 업무 자동화)

**목표:** Jira 및 Slack 연동을 통해 WorkPresso의 일정을 외부 도구와 동기화하고 지능형 알림 생태계 구축

- [x] **Slack (Integration)**: **Daily 스마트 모닝 브리핑** 기능 구현 ✅ 실제 Slack 전송 완료
  - 매일 아침 설정된 시간에 오늘 일정 및 Jira 할 일을 AI가 요약하여 Slack 메시지로 전송
  - `GET /api/automation/daily-briefing` — 실제 Supabase 일정 + 실제 Jira API, Slack Webhook 전송
- [x] **Slack (Interaction)**: **10분 전 맥락 리마인더 & RSVP** 인터랙티브 버튼 구현 ✅ 실제 Slack 전송 완료
  - 회의 시작 전 관련 문서(Pod A) 및 회의록(Pod D) 컨텐츠를 포함한 알림 전송 및 Slack 내 즉시 응답
  - `GET /api/automation/meeting-reminder` — 10~15분 이내 MEETING 감지, RSVP Block Kit 페이로드 실전 전송
- [x] **Jira (Sync)**: **Jira Due Date ↔ WorkPresso 캘린더** 양방향 동기화 ✅ 실제 Jira API 연동 완료
  - 본인에게 할당된 Jira 티켓의 마감일을 캘린더에 자동 표시
  - `POST /api/automation/jira-sync` — 실제 `workpresso.atlassian.net` KAN 프로젝트 이슈 동기화, 중복 방지
- [x] **Jira (Automation)**: **포커스 타임(Focus Time) 자동 방어** 로직 구현 ✅ 실제 Jira API 연동 완료
  - 우선순위 높은 Jira 티켓 처리를 위한 빈 시간 스케줄 자동 생성 및 상태 업데이트
  - `POST /api/automation/focus-time` — 실제 Jira Highest/High 이슈 기반 90분 블록, 하루 최대 3개
