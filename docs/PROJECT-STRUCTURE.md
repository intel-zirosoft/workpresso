# WorkPresso Project Structure Guide
<!-- WorkPresso 프로젝트 폴더 구조 가이드 -->

이 문서는 WorkPresso 모노레포 프로젝트의 폴더 구조와 각 영역의 역할을 설명합니다.

---

## 📂 1. Root Directory (`/`)
전체 프로젝트를 관리하는 최상단 폴더입니다.

- **`apps/`**: 실제 실행 가능한 애플리케이션들이 위치합니다.
- **`packages/`**: 여러 앱에서 공유하여 사용하는 라이브러리 및 설정입니다.
- **`docs/`**: 협업 가이드, 기술 스택, 의존성 관리 등 프로젝트 문서가 위치합니다.
- **`message.txt`**: 프로젝트의 핵심 디자인 테마 및 제품 개요가 담긴 원본 문서입니다.

---

## 🌐 2. Apps Area (`/apps`)
실제 배포 및 실행 단위입니다.

- **`apps/web/`**: Next.js 기반의 메인 웹 애플리케이션입니다. (현재 주력 작업 공간)
- **`apps/mobile/`**: React Native 기반의 모바일 애플리케이션입니다. (향후 개발 예정)

---

## 📦 3. Packages Area (`/packages`)
프로젝트 전반에 걸쳐 공유되는 '진실의 원천(Source of Truth)'입니다.

- **`packages/db/`**: 데이터베이스 스키마(`schema.db`)가 위치합니다. DB 구조 변경 시 가장 먼저 작업하는 곳입니다.
- **`packages/ui-kit/`**: 전역 공통 UI 컴포넌트를 관리합니다. (준비 중)
- **`packages/utils/`**: 모든 앱에서 공용으로 사용하는 로직 유틸리티입니다.

---

## 🏗️ 4. Web Deep Dive (`/apps/web/src`)
웹 프로젝트의 내부 구조이며, 팀원들이 가장 많이 머무르는 곳입니다.

### `app/` (Next.js App Router)
라우팅과 페이지 레이아웃을 담당합니다.
- **`(groups)/`**: Pod별 영역 분리 (URL에 영향 없음). 예: `(docs)`, `(schedules)` 등.
- **`api/`**: AI 연동 등 서버 사이드 로직을 위한 API 엔드포인트입니다.

### `features/` (핵심 비즈니스 로직)
수직적 분할(Vertical Slicing)의 핵심으로, 각 Pod의 실질적인 구현체가 모여 있습니다.
- **`pod-x/components/`**: 해당 도메인 전용 UI 컴포넌트.
- **`pod-x/services/`**: Supabase 연동 및 Server Actions 로직.
- **`pod-x/hooks/`**: 도메인 전용 React Hooks.

### `lib/` (외부 설정)
- **`supabase/`**: 서버/클라이언트용 Supabase 인스턴스 생성 유틸리티.

### `providers/` (전역 상태)
- **`index.tsx`**: QueryClient 등 앱 전체를 감싸는 Context Provider 모음.

### `styles/` (디자인)
- **`globals.css`**: Tailwind 기반의 전역 디자인 토큰 및 베이스 스타일.

---

## 📜 5. Docs Area (`/docs`)
협업을 위한 규칙들이 담겨 있습니다.

- **`COLLABORATION-GUIDE.md`**: 협업 철학 및 AI 활용 가이드.
- **`TECH-STACK-MANIFESTO.md`**: 기술 스택 선정 이유와 라이브러리 목록.
- **`DEPENDENCIES.md`**: 설치된 모든 라이브러리의 용도와 설치자 기록.
- **`Pod-X-SKILL.md`**: 각 파드별 구체적인 개발 지침 및 책임 범위.

---

**Tip**: 작업 전 항상 `schema.db`를 확인하고, 새로운 기능을 만들 때는 `apps/web/src/features/` 아래에 자신의 파드 폴더를 먼저 확인하세요!
