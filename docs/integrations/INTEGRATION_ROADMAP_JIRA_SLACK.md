# 🚀 WorkPresso: Jira & Slack 전사 연동 로드맵 (Pod별 활용 계획)

## 🎯 개요
현재 Pod D(음성 회의록)에서 성공적으로 검증된 **회의록 → Jira 할 일 연동** 및 **Slack AI 브리핑** 경험을 바탕으로, WorkPresso의 나머지 Pod(A, B, C)로 외부 도구 연동을 확장하여 완벽한 '지능형 업무 자동화 생태계'를 구축하기 위한 계획서입니다. 🕵️‍♂️ 🏛️ 🚀 

특히 활용처가 막막할 수 있는 **Slack의 양방향 인터랙션 기능**을 적극 활용하는 방안을 포함하여, Slack이 단순한 '알림 자판기'를 넘어 'WorkPresso의 원격 리모컨'이 되도록 설계했습니다. 🚀🏛️

---

## 1. Pod A: Canvas (문서 및 지식 관리)

### ⚡ Slack 활용: 알림 및 리모트 승인 파이프라인
*   **리모트 결재 (Block Kit 양방향 승인)**: 문서 리뷰 요청 시, 브라우저를 켤 필요 없이 Slack 메시지 내에 배치된 **[승인]** / **[반려]** 버튼을 눌러 즉시 결재 처리. 🕵️‍♂️ 🏛️ 🚀 
*   **문서 상태 변경 알림**: 기획서나 중요 정책 문서의 상태가 `작성 중` → `리뷰 요청` → `퍼블리시 완료`로 변경될 때, 관련 채널로 즉시 Slack 알림 전송.

### 🛠️ Jira 연동: 기획-실행 다이렉트 브릿지
*   **에픽/스토리 일괄 자동 생성**: Canvas에서 작성한 PRD(제품 요구사항 정의서) 내의 기능 명세표를 기반으로, 클릭 한 번에 여러 개의 Jira 에픽 및 스토리 티켓을 일괄 생성. 🚀🏛️
*   **문서 내 라이브 위젯**: Canvas 문서 내에 관련된 Jira 티켓의 실시간 진행 상태를 동기화하여 보여주는 라이브 블록 삽입.

---

## 2. Pod B: Schedules (일정 및 이벤트 관리)

### ⚡ Slack 활용: AI가 배달하는 개인화 비서
*   **Daily 스마트 모닝 브리핑**: 매일 아침 출근 시간(9시), 오늘 참석해야 할 주요 회의 일정과 마감일이 도래한 할 일(Jira 티켓 포함)을 AI가 요약하여 Slack 메시지로 배달. 🕵️‍♂️ 🏛️ 🚀 
*   **RSVP (참석 여부 즉시 응답)**: 워크숍이나 전사 이벤트 등록 시, Slack 메시지로 **[참석]** / **[불참]** 버튼을 띄워 캘린더 DB와 즉각 동기화. 🚀🏛️

### 🛠️ Jira 연동: 일정-태스크 융합
*   **Jira Due Date ↔ 캘린더 연동**: 본인에게 할당된 Jira 티켓의 마감일이 WorkPresso 캘린더에 자동으로 블록으로 표시. 🕵️‍♂️ 🏛️ 🚀 

---

## 3. Pod C: AI Agent & Chatter (지식 검색 및 커뮤니케이션)

### ⚡ Slack 활용: WorkPresso를 Slack 안으로 이식
*   **Slack Slash Command (`/workpresso`)**: Slack 대화창에서 `/workpresso 지난주 기획 회의 요약해줘` 라고 치면, Pod C의 AI Agent가 WorkPresso DB를 긁어와서 Slack 창에 즉시 답변. 🕵️‍♂️ 🏛️ 🚀 
*   **스레드 지식화 (Thread Capture)**: Slack에서 길게 이어진 중요한 의사결정 스레드에서 메시지 메뉴의 'WorkPresso로 저장'을 눌러 영구적인 Canvas 문서 자산으로 변환.

### 🛠️ Jira 연동: 지능형 프로젝트 매니징
*   **대화 기반 자동 티켓팅**: Chatter에서 팀원과 특정 버그나 이슈에 대해 논의하다가, AI가 맥락을 파악하여 "논의하신 내용을 Jira 버그 티켓으로 생성해 드릴까요?" 라고 팝업으로 역제안. 🚀🏛️

---

## 🏁 개발 추진 가이드 (우선순위 제안)

1.  **Phase 1 (Quick Win)**: **Pod B의 Daily 스마트 모닝 브리핑 (Slack)** 🕵️‍♂️ 🏛️ 🚀 
2.  **Phase 2 (Core Capability)**: **Pod C의 AI Agent 연계 Jira 현황 조회** 🚀🏛️
3.  **Phase 3 (Enterprise Feature)**: **Pod A 문서 내 Jira 일괄 생성 및 라이브 모니터링** 🕵️‍♂️ 🏛️ 🚀 

---
**- WorkPresso Automation Strategy Document**
