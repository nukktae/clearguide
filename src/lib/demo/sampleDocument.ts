import { ParsedDocument } from "@/src/lib/parsing/types";

export const DEMO_DOCUMENT_ID = "demo-tax-notice-2025";

export const demoParsedDocument: ParsedDocument = {
  documentId: DEMO_DOCUMENT_ID,
  summary: {
    bullets: [
      "2024년 종합소득세 신고 및 납부 안내",
      "납부 기한: 2025년 5월 31일까지",
      "납부 금액: 450,000원",
      "온라인 신고 가능 (홈택스)",
    ],
    docType: "세금고지서",
    tone: "formal",
    mainSubject: "종합소득세 납부",
    mainAction: "2025년 5월 31일까지 납부",
    entities: {
      dates: ["2025-05-31"],
      amounts: ["450,000원"],
      places: ["홈택스"],
    },
  },
  actions: [
    {
      id: "demo-action-1",
      title: "홈택스에서 종합소득세 신고하기",
      description: "홈택스(www.hometax.go.kr)에 접속하여 종합소득세를 신고하세요.",
      deadline: "2025-05-31",
      locationType: "online",
      locationName: "홈택스",
      requiredDocs: ["소득금액증명원", "의료비 영수증"],
      notes: "신고 후 납부까지 완료해야 합니다.",
      completed: false,
    },
    {
      id: "demo-action-2",
      title: "세금 납부하기",
      description: "신고 완료 후 450,000원을 납부하세요. 온라인 납부 가능합니다.",
      deadline: "2025-05-31",
      locationType: "online",
      locationName: "홈택스",
      requiredDocs: [],
      notes: "납부 기한을 넘기면 가산세가 부과됩니다.",
      completed: false,
    },
  ],
  risks: [
    {
      id: "demo-risk-1",
      type: "deadline",
      severity: "high",
      title: "납부 기한 경과 시 가산세 부과",
      message: "2025년 5월 31일까지 납부하지 않으면 가산세가 부과됩니다. 기한을 반드시 지켜주세요.",
      deadline: "2025-05-31",
      amount: "가산세 약 10%",
      conditions: ["납부 기한 경과", "미납 상태 유지"],
    },
    {
      id: "demo-risk-2",
      type: "penalty",
      severity: "medium",
      title: "신고 누락 시 과태료",
      message: "소득세 신고를 누락하면 과태료가 부과될 수 있습니다.",
      conditions: ["신고 기한 경과"],
    },
  ],
  eligibilityHints: [
    "소득이 있는 모든 납세자는 종합소득세를 신고해야 합니다.",
    "의료비, 교육비 등 공제 항목을 확인하세요.",
  ],
  meta: {
    parsedAt: new Date().toISOString(),
    confidence: 95,
    language: "ko",
  },
};

export const demoDocumentRecord = {
  id: DEMO_DOCUMENT_ID,
  fileName: "2024년_종합소득세_고지서_샘플.pdf",
  fileType: "application/pdf",
  fileSize: 245760,
  uploadedAt: new Date().toISOString(),
  parsed: demoParsedDocument,
};

