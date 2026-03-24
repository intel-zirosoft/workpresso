# WorkPresso Project Structure Guide
<!-- WorkPresso 프로젝트 폴더 구조 가이드 -->

이 문서는 WorkPresso 모노레포 프로젝트의 폴더 구조와 각 영역의 역할을 설명합니다. 우리 프로젝트는 **'수직적 분할(Vertical Slicing)'**과 **'파드(Pod)'** 중심의 협업 방식을 채택하고 있습니다.

---

## 🌳 1. Visual Directory Tree
전체 프로젝트의 핵심 구조를 한눈에 파악하세요.

```text
WorkPresso/
├── .github/                # GitHub Actions (AI PR 리뷰어 등)
├── apps/                   # 실행 가능한 애플리케이션
│   ├── web/                # Next.js 메인 웹 앱 (주력 작업 공간)
│   ├── mobile/             # React Native 앱 (예정)
│   └── api/                # 공용 API 서버 (예정)
├── packages/               # 공유 패키지 (Source of Truth)
│   ├── db/                 # 데이터베이스 스키마 (schema.db)
│   └── ...                 # ui-kit, utils 등 (준비 중)
├── docs/                   # 프로젝트 문서 및 AI 스킬 가이드
└── message.txt             # 제품 개요 및 디자인 테마 원본
```

---

## 📂 2. Core Directories Explained

### 📁 `apps/` (Applications)
실제 배포 및 실행 단위입니다.
- **`apps/web/`**: Next.js 기반의 풀스택 앱입니다. UI와 서버 로직이 모두 이곳에서 구현됩니다.

### 📁 `packages/` (Shared Packages)
프로젝트 전반에 걸쳐 공유되는 데이터와 로직의 '진실의 원천'입니다.
- **`packages/db/schema.db`**: **가장 중요한 파일**입니다. 모든 데이터 관련 작업 전에 반드시 확인해야 하는 PostgreSQL 스키마 정의 파일입니다.

### 📁 `.github/` (Automation)
- **`workflows/`**: CI/CD 설정 및 **Gemini AI PR Reviewer**와 같은 자동화 도구가 포함되어 있습니다. 코드를 올리면 AI가 자동으로 리뷰를 남겨줍니다.

---

## 🏗️ 3. Web App Deep Dive (`/apps/web/src`)
수직적 분할(Vertical Slicing)이 실제로 일어나는 곳입니다.

### 🧩 `features/` (Pod-based Implementation)
이곳은 담당 업무(Pod)별로 폴더가 나뉘어 있습니다. 프론트엔드와 백엔드를 나누지 않고 **'기능 단위'**로 폴더를 구성합니다.
- **`pod-a/`**: 전자결재 문서 관련 (Pod A)
- **`pod-b/`**: 업무 일정 관련 (Pod B)
- **`pod-c/`**: AI 지식 지도 관련 (Pod C)
- **`pod-d/`**: 회의록 및 오디오 처리 관련 (Pod D)

> [!IMPORTANT]
> 각 Pod 폴더 안에는 해당 기능을 위한 `components/`, `services/`, `hooks/`가 모두 포함되어 있어, 한 폴더 안에서 하나의 기능을 완성할 수 있습니다.

---

## 📜 4. Docs & AI Skills (`/docs`)
협업 규칙과 AI 에이전트의 페르소나를 정의합니다.

- **`COLLABORATION-GUIDE.md`**: 협업 철학과 AI 활용 절대 수칙.
- **`Pod-X-SKILL.md`**: 각 파드 담당 에이전트가 지켜야 할 기술적 규칙과 도메인 지식.
- **`DEPENDENCIES.md`**: 라이브러리 설치 시 중복을 막기 위한 기록장.

---

**Tip**: 작업을 시작할 때는 루틴을 만드세요! 
1. `docs/PROJECT-STRUCTURE.md`로 위치 파악 
2. `packages/db/schema.db`로 데이터 구조 확인 
3. 해당 `features/pod-x/`에서 개발 시작!
