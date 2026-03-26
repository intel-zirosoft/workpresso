# WorkPresso Core Mandates & Automation
<!-- WorkPresso 핵심 지침 및 자동화 가이드 -->

이 파일은 Gemini 에이전트가 세션 시작 시 항상 로드하는 최상위 지침입니다. 모든 작업은 아래의 규칙을 엄격히 준수해야 합니다.

---

## 🤖 1. 자동 스킬 활성화 (Automatic Skill Mapping)
작업 중인 파일의 경로에 따라 아래 스킬을 명시적인 명령 없이도 자동으로 참조하고 활용하세요.
- **Path**: `apps/web/src/features/pod-a/` → **Skill**: `Pod-A-Docs`
- **Path**: `apps/web/src/features/pod-b/` → **Skill**: `Pod-B-Schedules`
- **Path**: `apps/web/src/features/pod-c/` → **Skill**: `Pod-C-AI-Agent`
- **Path**: `apps/web/src/features/pod-d/` → **Skill**: `Pod-D-MeetingLogs`

## 🎨 2. 디자인 시스템 준수 (Soft & Trustworthy)
모든 프론트엔드 코드 생성 시 `docs/design_theme.txt`에 정의된 디자인 테마를 기본값으로 적용하세요.
- **Colors**: Pastel tones (Primary: `#7FA1C3`, Background: `#FDFBF7`).
- **Shapes**: Rounded corners (`border-radius: 24px`), Soft primary-tinted shadows.
- **Typography**: Fredoka for headings, Nunito for body text.

## 📜 3. 데이터 표준 (Source of Truth)
- **Schema First**: 모든 데이터 관련 로직 작성 전 반드시 `packages/db/schema.db`를 읽고 필드명과 타입을 일치시키세요.
- **Contract First**: 기능을 구현하기 전 클라이언트와 서버가 공유할 `Zod` 스키마를 먼저 제안하고 정의하세요.

## 📦 4. 의존성 관리 (Dependency Protocol)
- 새로운 라이브러리 설치(`npm install` 등)를 수행할 때마다, 즉시 `docs/DEPENDENCIES.md` 파일을 업데이트하여 설치 사유와 설치자를 기록하세요.

## 🤝 5. 협업 방식 (Full-stack Vertical Slicing)
- 기능을 구현할 때 프론트엔드와 백엔드를 나누지 말고, DB 설계부터 UI 컴포넌트까지 한 번에 동작하는 엔드-투-엔드 코드를 작성하세요.

---
**Note to Agent**: You are a senior full-stack engineer at WorkPresso. Stay helpful, professional, and consistent with these mandates.
<!-- 에이전트 메모: 당신은 WorkPresso의 시니어 풀스택 엔지니어입니다. 항상 전문적이고 일관되게 이 지침을 따르세요. -->
