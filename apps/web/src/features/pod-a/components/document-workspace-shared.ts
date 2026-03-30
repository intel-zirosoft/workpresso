import {
  type ApprovalStepStatus,
  type ApprovalStepInput,
  type DocumentDetail,
  type DocumentScope,
  type DocumentStatus,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";

export type StatusFilter = "ALL" | DocumentStatus;

export type EditorStep = "template" | "content" | "workflow";

export type DocumentTemplateId =
  | "general"
  | "expense"
  | "project"
  | "purchase"
  | "report"
  | "leave"
  | "skip";

export type DocumentTemplateOption = {
  id: DocumentTemplateId;
  label: string;
  summary: string;
  title: string;
  content: string;
};

export type EditorApprovalStep = ApprovalStepInput & {
  localId: string;
};

export type EditorState = {
  title: string;
  content: string;
  approvalSteps: EditorApprovalStep[];
  ccRecipientIds: string[];
};

const DEFAULT_APPROVAL_STEP_LABELS = ["팀장", "부서장", "대표"];

export const statusLabelMap: Record<DocumentStatus, string> = {
  DRAFT: "초안",
  PENDING: "결재 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const statusBadgeClassMap: Record<DocumentStatus, string> = {
  DRAFT: "bg-secondary/70 text-text",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export const approvalStepStatusLabelMap: Record<ApprovalStepStatus, string> = {
  WAITING: "결재 예정",
  PENDING: "결재 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const approvalStepStatusBadgeClassMap: Record<
  ApprovalStepStatus,
  string
> = {
  WAITING: "bg-slate-200 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export const scopeConfig: Array<{
  value: DocumentScope;
  label: string;
  hint: string;
}> = [
  { value: "authored", label: "내 문서 Grid", hint: "내가 작성한 문서" },
  { value: "approvals", label: "내 결재함", hint: "지금 결재할 문서" },
  { value: "cc", label: "공람 문서", hint: "참조로 받은 문서" },
];

export const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "DRAFT", label: "초안" },
  { value: "PENDING", label: "결재 대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

export const documentTemplateOptions: DocumentTemplateOption[] = [
  {
    id: "general",
    label: "일반 결재 문서",
    summary: "가장 범용적인 승인 문서 형식입니다.",
    title: "결재 요청서",
    content: `## 요청 개요
- **제목:**  
- **목적:**  
- **요청 내용:**  

---

## 상세 내용
- 배경:  
- 진행 필요 사항:  
- 기대 효과:  

---

## 일정
- 시작일:  
- 종료일:  

---

## 참고 사항
- 첨부파일:  
- 기타:  `,
  },
  {
    id: "expense",
    label: "지출 결의서",
    summary: "예산 사용 목적과 예상 비용을 정리합니다.",
    title: "지출 결의 요청",
    content: `## 지출 개요
- **지출 항목:**  
- **지출 목적:**  
- **총 금액:**  

---

## 지출 내역
| 항목 | 금액 | 비고 |
|------|------|------|
|  |  |  |
|  |  |  |

---

## 결제 정보
- 결제 수단:  
- 지급 예정일:  

---

## 첨부
- 영수증: ☐ 있음 / ☐ 없음  
- 기타:  `,
  },
  {
    id: "project",
    label: "프로젝트 승인 요청서",
    summary: "프로젝트 개요와 일정, 기대 효과를 정리합니다.",
    title: "프로젝트 승인 요청",
    content: `## 프로젝트 개요
- **프로젝트명:**  
- **목적:**  
- **배경 및 필요성:**  

---

## 주요 내용
- 범위:  
- 핵심 기능:  
- 기대 성과:  

---

## 일정
- 기획:  
- 개발:  
- 완료:  

---

## 예산
- 총 예산:  
- 주요 항목:  

---

## 리스크
- 예상 문제:  
- 대응 방안:  `,
  },
  {
    id: "purchase",
    label: "구매 요청서",
    summary: "필요 물품과 구매 사유를 중심으로 작성합니다.",
    title: "구매 요청",
    content: `## 구매 개요
- **구매 목적:**  
- **사용 용도:**  

---

## 구매 내역
| 품목명 | 수량 | 단가 | 금액 | 비고 |
|--------|------|------|------|------|
|  |  |  |  |  |
|  |  |  |  |  |

---

## 공급 정보
- 업체명:  
- 견적: ☐ 있음 / ☐ 없음  

---

## 납기
- 요청 납기일:  `,
  },
  {
    id: "report",
    label: "업무 보고 및 승인서",
    summary: "진행 현황 보고와 후속 승인 요청을 함께 담습니다.",
    title: "업무 보고 및 승인 요청",
    content: `## 업무 개요
- **업무명:**  
- **목적:**  

---

## 진행 내용
- 수행 내용:  
- 진행 상태: ☐ 진행 중 / ☐ 완료  

---

## 결과
- 주요 성과:  
- 결과 요약:  

---

## 이슈
- 문제점:  
- 개선 방안:  

---

## 요청 사항
- 확인 및 승인 요청:  `,
  },
  {
    id: "leave",
    label: "연차/휴가 신청서",
    summary: "휴가 종류를 선택하고 기간 및 사유를 작성하여 신청합니다.",
    title: "연차/휴가 신청",
    content: `## 휴가 정보
- **휴가 종류:** 연차 / 오전반차 / 오후반차 / 병가 / 기타 ( )
- **신청 기간:** 2026-00-00 ~ 2026-00-00
- **총 일수:** 0일

---

## 신청 사유
- 사유: 개인 사정 및 가사로 인한 휴가 신청

---

## 비상 연락망
- 연락처: 010-0000-0000
- 대리 업무 담당자: `,
  },
  {
    id: "skip",
    label: "새 양식 만들기",
    summary: "템플릿 없이 빈 문서에서 자유롭게 업무를 시작하세요.",
    title: "",
    content: "",
  },
];

export function createEmptyEditorState(): EditorState {
  return {
    title: "",
    content: "",
    approvalSteps: DEFAULT_APPROVAL_STEP_LABELS.map((stepLabel, index) => ({
      localId: `${stepLabel}-${index}`,
      stepLabel,
      approverId: "",
    })),
    ccRecipientIds: [],
  };
}

export function createEditorStateFromDocument(
  document: DocumentDetail,
): EditorState {
  return {
    title: document.title,
    content: document.content,
    approvalSteps: document.approvalSteps.map((step) => ({
      localId: step.id,
      stepLabel: step.stepLabel,
      approverId: step.approverId,
    })),
    ccRecipientIds: document.ccRecipients.map(
      (recipient) => recipient.recipientId,
    ),
  };
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function renderUserName(user: DocumentUser | null | undefined) {
  if (!user) {
    return "-";
  }

  return user.department ? `${user.name} · ${user.department}` : user.name;
}
