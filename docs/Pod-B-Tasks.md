# Pod B: Schedules System (업무 및 일정 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod B의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 캘린더 뷰 및 일정 CRUD

**목표:** 개인 일정 관리를 위한 캘린더 인터페이스 및 데이터 처리

- [ ] **DB/Schema**: `packages/db/schema.db`의 `schedules` 테이블 스키마 확인 및 Zod 스키마 정의
- [ ] **Backend (API)**: 일정 생성(POST), 조회(GET), 수정(PATCH), 삭제(DELETE) API 엔드포인트 구현
- [ ] **Data Processing**: 서버(UTC)와 클라이언트(Local Timezone) 간의 시간 변환 로직 구현 (`date-fns` 활용)
- [ ] **Frontend (UI)**: 캘린더 뷰 컴포넌트 렌더링 (`shadcn/ui`의 `react-day-picker` 활용)
- [ ] **Frontend (UI)**: 일정 등록/수정 모달 폼 및 캘린더 내 일정 표시 마크업 구현
- [ ] **Security**: 사용자가 본인의 일정만 조회 및 수정할 수 있도록 엄격한 RLS 정책 적용

## 🧑‍💻 Part 2: 근태 상태/칸반 UI 및 외부 연동

**목표:** 팀원의 현재 상태(근태)를 시각화하고 타 파드와의 API 연동점 제공

- [ ] **DB/Schema**: 근태 상태(출근, 퇴근, 회의중, 연차 등) 업데이트용 DB 필드 처리
- [ ] **Frontend (UI)**: 일정 및 상태를 관리할 수 있는 칸반(Kanban) 보드 마크업 구현 (상태별 Tailwind 공통 컬러 팔레트 적용)
- [ ] **Frontend (State)**: 드래그 앤 드롭 또는 버튼 클릭을 통한 상태 변경 및 API 연동
- [ ] **Integration (Pod C API)**: Pod C(AI 에이전트)가 유저를 대신해 일정을 등록할 수 있도록 전용 POST 엔드포인트 오픈 및 권한 설정
- [ ] **Design Theme**: 전체 UI에 부드러운 파스텔 톤 및 `shadow-soft` 스타일 적용
