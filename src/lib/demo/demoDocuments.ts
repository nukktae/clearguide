import { DocumentRecord } from "@/src/lib/parsing/types";
import { ParsedDocument } from "@/src/lib/parsing/types";

export const DEMO_TAX_ID = "demo-tax-notice-2025";
export const DEMO_COMMUNITY_ID = "demo-community-notice-2025";
export const DEMO_PENALTY_ID = "demo-penalty-notice-2025";

const taxParsedDocument: ParsedDocument = {
  documentId: DEMO_TAX_ID,
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
      id: "demo-tax-action-1",
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
      id: "demo-tax-action-2",
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
      id: "demo-tax-risk-1",
      type: "deadline",
      severity: "high",
      title: "납부 기한 경과 시 가산세 부과",
      message: "2025년 5월 31일까지 납부하지 않으면 가산세가 부과됩니다. 기한을 반드시 지켜주세요.",
      deadline: "2025-05-31",
      amount: "가산세 약 10%",
      conditions: ["납부 기한 경과", "미납 상태 유지"],
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

const communityParsedDocument: ParsedDocument = {
  documentId: DEMO_COMMUNITY_ID,
  summary: {
    bullets: [
      "주민센터 민원 신청 안내",
      "신청 기한: 2025년 2월 15일까지",
      "방문 또는 온라인 신청 가능",
      "필수 서류: 주민등록등본, 신분증",
    ],
    docType: "주민센터 안내문",
    tone: "formal",
    mainSubject: "민원 신청",
    mainAction: "2025년 2월 15일까지 신청",
    entities: {
      dates: ["2025-02-15"],
      places: ["주민센터"],
    },
  },
  actions: [
    {
      id: "demo-community-action-1",
      title: "주민센터 방문 또는 온라인 신청",
      description: "가까운 주민센터를 방문하거나 정부24에서 온라인으로 신청할 수 있습니다.",
      deadline: "2025-02-15",
      locationType: "offline",
      locationName: "주민센터",
      requiredDocs: ["주민등록등본", "신분증"],
      notes: "방문 시 운영시간을 확인하세요.",
      completed: false,
    },
  ],
  risks: [
    {
      id: "demo-community-risk-1",
      type: "deadline",
      severity: "medium",
      title: "신청 기한 경과 시 재신청 필요",
      message: "기한 내 신청하지 않으면 다음 기회까지 기다려야 할 수 있습니다.",
      deadline: "2025-02-15",
      conditions: ["신청 기한 경과"],
    },
  ],
  eligibilityHints: [
    "해당 지역 거주자만 신청 가능합니다.",
    "신분증과 주소지 확인이 필요합니다.",
  ],
  meta: {
    parsedAt: new Date().toISOString(),
    confidence: 92,
    language: "ko",
  },
};

const penaltyParsedDocument: ParsedDocument = {
  documentId: DEMO_PENALTY_ID,
  summary: {
    bullets: [
      "주차 위반 과태료 통지",
      "납부 기한: 2025년 1월 20일까지",
      "납부 금액: 40,000원",
      "온라인 납부 가능",
    ],
    docType: "과태료 통지",
    tone: "formal",
    mainSubject: "주차 위반 과태료",
    mainAction: "2025년 1월 20일까지 납부",
    entities: {
      dates: ["2025-01-20"],
      amounts: ["40,000원"],
    },
  },
  actions: [
    {
      id: "demo-penalty-action-1",
      title: "과태료 납부하기",
      description: "온라인(정부24, 홈택스) 또는 은행 창구에서 납부할 수 있습니다.",
      deadline: "2025-01-20",
      locationType: "online",
      locationName: "정부24, 홈택스",
      requiredDocs: [],
      notes: "기한 내 납부하지 않으면 가산금이 부과됩니다.",
      completed: false,
    },
  ],
  risks: [
    {
      id: "demo-penalty-risk-1",
      type: "penalty",
      severity: "high",
      title: "납부 기한 경과 시 가산금 부과",
      message: "2025년 1월 20일까지 납부하지 않으면 가산금이 부과됩니다.",
      deadline: "2025-01-20",
      amount: "가산금 약 20%",
      conditions: ["납부 기한 경과"],
    },
  ],
  eligibilityHints: [
    "과태료는 신속히 납부하는 것이 좋습니다.",
    "이의신청이 필요한 경우 기한 내 신청하세요.",
  ],
  meta: {
    parsedAt: new Date().toISOString(),
    confidence: 98,
    language: "ko",
  },
};

export const demoDocuments: Record<string, DocumentRecord> = {
  [DEMO_TAX_ID]: {
    id: DEMO_TAX_ID,
    fileName: "2024년_종합소득세_고지서_샘플.pdf",
    fileType: "application/pdf",
    fileSize: 245760,
    uploadedAt: new Date().toISOString(),
    parsed: taxParsedDocument,
  },
  [DEMO_COMMUNITY_ID]: {
    id: DEMO_COMMUNITY_ID,
    fileName: "주민센터_민원신청_안내문_샘플.pdf",
    fileType: "application/pdf",
    fileSize: 189440,
    uploadedAt: new Date().toISOString(),
    parsed: communityParsedDocument,
  },
  [DEMO_PENALTY_ID]: {
    id: DEMO_PENALTY_ID,
    fileName: "주차위반_과태료_통지서_샘플.pdf",
    fileType: "application/pdf",
    fileSize: 156672,
    uploadedAt: new Date().toISOString(),
    parsed: penaltyParsedDocument,
  },
};

export const demoDocumentList = [
  {
    id: DEMO_TAX_ID,
    title: "세금 고지서",
    subtitle: "샘플",
    icon: "💰",
  },
  {
    id: DEMO_COMMUNITY_ID,
    title: "주민센터 안내문",
    subtitle: "샘플",
    icon: "🏛️",
  },
  {
    id: DEMO_PENALTY_ID,
    title: "과태료 통지",
    subtitle: "샘플",
    icon: "⚠️",
  },
];

