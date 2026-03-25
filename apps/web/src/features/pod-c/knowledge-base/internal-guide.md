# 🏢 WorkPresso 전사 운영 가이드 (Official)

본 문서는 WorkPresso의 공식 운영 및 기술 표준 가이드라인입니다.

## [개발 표준]
- **프레임워크**: Next.js 14 (App Router)
- **상태 관리**: TanStack Query (React Query)
- **UI 라이브러리**: Tailwind CSS + shadcn/ui
- **브랜치 전략**: Git Flow 준수 (feat/, fix/, docs/)

## [근무 환경]
- **코어 타임**: 13:00 ~ 17:00 (필수 협업 시간)
- **리모트 근무**: 주 2회 권장
- **회의 원칙**: 모든 회의는 30분 이내 종료, 아젠다 필수 공유

## [보안 수칙]
- 모든 API 키 및 비밀값은 `.env.local`에서 관리하며 Git 커밋을 엄격히 금지합니다.
- 프로덕션 데이터베이스 접근은 인가된 IP에서만 가능합니다.
