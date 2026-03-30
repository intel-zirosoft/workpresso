**작성자 :** 팀장 이지호 

**작성 시간 :** 2026-03-25 17:15 

 **2026-03-25 / 2팀 / 워크프레소(Workpresso)**

---

### Agenda1. 일정 관리 시스템(Pod B) 고도화 및 백엔드 보안 강화

- 회의 안건 : 데이터 무결성 확보 및 사용자별 데이터 격리 보안 정책 수립
- 회의 내용 : `schedules` 테이블에 RLS(Row Level Security) 정책을 적용하여 본인의 데이터만 접근 가능하도록 보안을 강화함. Zod를 활용한 서버 측 유효성 검사 로직과 `deleted_at` 컬럼을 활용한 소프트 삭제(Soft Delete) 방식을 채택하여 데이터 안정성을 확보함. 또한 KST-UTC 간 시간 변환 로직(date-fns)을 구현하여 프론트엔드 연동 완성도를 높임.

### Agenda2. AI 에이전트(Pod C) 및 음성 처리(Pod D) 핵심 파이프라인 구축

- 회의 안건 : Vercel AI SDK 도입 및 STT 엔진 연동을 통한 지식 관리 자동화
- 회의 내용 : 개발 효율성 극대화를 위해 Vercel AI SDK를 채택하고, 로컬 마크다운 파일을 벡터 DB로 자동 동기화하는 API를 구현함. 음성 처리 시스템의 경우 Gemini 1.5 Flash STT 엔진 연동을 완료하여 오디오를 텍스트로 변환하는 핵심 로직을 구축함. 변환된 결과물을 Supabase Storage 및 DB(`meeting_logs`)에 저장하는 인터페이스를 확정함.

### Agenda3. 개발 환경 이슈 대응 및 Git 워크플로우 정립

- 회의 안건 : 팀 내 반복되는 환경 오류(WSL, 경로 인식) 및 Git 충돌 해결 방안 논의
- 회의 내용 : 터미널 경로 내 괄호 포함(`(schedules)`) 문제와 WSL 폴더 권한 이슈 등 개발 환경에서 발생하는 병목을 공유하고, OS별 표준 명령어(Move-Item, sudo chown) 적용 가이드를 전파함. Git 병합 과정에서의 충돌은 `stash`와 `checkout -f`를 활용해 정리하는 프로세스를 정립하고, `.gitignore` 재설정 및 Force Push를 통해 히스토리를 정규화함.

# 결론

1. 일정 관리 CRUD 및 RLS 보안 정책, 소프트 삭제 로직 구현 완료
2. STT 엔진 연동 및 텍스트 변환 로직, 벡터 DB 동기화 API 구축 완료
3. 개발 환경(권한, 경로) 오류 해결 및 Git 브랜치 관리 전략 최적화

# Task Timeline

- [x]  schedules 테이블 RLS 및 CRUD API 구현 (Pod B)
- [x]  Vercel AI SDK 적용 및 벡터 DB 동기화 API 구현 (Pod C)
- [x]  Gemini 1.5 Flash STT 엔진 연동 및 오디오 처리 (Pod D)
- [x]  환경 오류(WSL 권한, 경로 인식) 및 Git 충돌 해결
- [ ]  (내일) 타 파드 모듈(Login, Auth) 연동 및 보안 강화
- [ ]  (내일) 일정 조회 기능 고도화 및 동선 최적화 알고리즘 설계
- [ ]  (내일) STT 결과물과 지식 지도(Pod C) 간 데이터 인덱싱 연동
