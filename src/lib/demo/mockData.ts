import { DocumentRecord } from "@/src/lib/parsing/types";
import { ParsedDocument } from "@/src/lib/parsing/types";

/**
 * Mock data for development and demo purposes
 * Used in 보관함 (history) and calendar pages
 */

// Generate dates relative to today
const today = new Date();
const getDateString = (daysFromToday: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

const getPastDate = (daysAgo: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Mock Documents for 보관함 (History)
export const mockDocuments: DocumentRecord[] = [
  // Tax Documents
  {
    id: "mock-doc-1",
    fileName: "2024년_종합소득세_고지서.pdf",
    fileType: "application/pdf",
    fileSize: 245760,
    uploadedAt: getPastDate(5),
    filePath: "/data/uploads/mock-tax-1.pdf",
    parsed: {
      documentId: "mock-doc-1",
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
          id: "action-1",
          title: "홈택스에서 종합소득세 신고하기",
          description: "홈택스(www.hometax.go.kr)에 접속하여 종합소득세를 신고하세요.",
          deadline: "2025-05-31",
          locationType: "online",
          locationName: "홈택스",
          requiredDocs: ["소득금액증명원", "의료비 영수증"],
          notes: "신고 후 납부까지 완료해야 합니다.",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-1",
          type: "deadline",
          severity: "high",
          title: "납부 기한 경과 시 가산세 부과",
          message: "2025년 5월 31일까지 납부하지 않으면 가산세가 부과됩니다.",
          deadline: "2025-05-31",
          amount: "가산세 약 10%",
        },
      ],
      meta: {
        parsedAt: getPastDate(5),
        confidence: 95,
        language: "ko",
      },
    },
  },
  {
    id: "mock-doc-2",
    fileName: "2024년_지방세_고지서.jpg",
    fileType: "image/jpeg",
    fileSize: 189440,
    uploadedAt: getPastDate(12),
    filePath: "/data/uploads/mock-tax-2.jpg",
    parsed: {
      documentId: "mock-doc-2",
      summary: {
        bullets: [
          "2024년 지방세 납부 안내",
          "납부 기한: 2025년 3월 15일까지",
          "납부 금액: 120,000원",
          "자동이체 또는 온라인 납부 가능",
        ],
        docType: "세금고지서",
        tone: "formal",
        mainSubject: "지방세 납부",
        mainAction: "2025년 3월 15일까지 납부",
        entities: {
          dates: ["2025-03-15"],
          amounts: ["120,000원"],
        },
      },
      actions: [
        {
          id: "action-2",
          title: "지방세 납부하기",
          description: "온라인 또는 은행 창구에서 납부할 수 있습니다.",
          deadline: "2025-03-15",
          locationType: "online",
          locationName: "정부24",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-2",
          type: "deadline",
          severity: "medium",
          title: "납부 기한 경과 시 가산금 부과",
          message: "기한 내 납부하지 않으면 가산금이 부과됩니다.",
          deadline: "2025-03-15",
        },
      ],
      meta: {
        parsedAt: getPastDate(12),
        confidence: 92,
        language: "ko",
      },
    },
  },
  // Penalty Documents
  {
    id: "mock-doc-3",
    fileName: "주차위반_과태료_통지서.pdf",
    fileType: "application/pdf",
    fileSize: 156672,
    uploadedAt: getPastDate(2),
    filePath: "/data/uploads/mock-penalty-1.pdf",
    parsed: {
      documentId: "mock-doc-3",
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
          id: "action-3",
          title: "과태료 납부하기",
          description: "온라인(정부24, 홈택스) 또는 은행 창구에서 납부할 수 있습니다.",
          deadline: "2025-01-20",
          locationType: "online",
          locationName: "정부24",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-3",
          type: "penalty",
          severity: "high",
          title: "납부 기한 경과 시 가산금 부과",
          message: "2025년 1월 20일까지 납부하지 않으면 가산금이 부과됩니다.",
          deadline: "2025-01-20",
          amount: "가산금 약 20%",
        },
      ],
      meta: {
        parsedAt: getPastDate(2),
        confidence: 98,
        language: "ko",
      },
    },
  },
  {
    id: "mock-doc-4",
    fileName: "음주운전_과태료_통지서.pdf",
    fileType: "application/pdf",
    fileSize: 178432,
    uploadedAt: getPastDate(8),
    filePath: "/data/uploads/mock-penalty-2.pdf",
    parsed: {
      documentId: "mock-doc-4",
      summary: {
        bullets: [
          "음주운전 과태료 통지",
          "납부 기한: 2025년 2월 10일까지",
          "납부 금액: 200,000원",
          "온라인 납부 또는 경찰서 방문",
        ],
        docType: "과태료 통지",
        tone: "formal",
        mainSubject: "음주운전 과태료",
        mainAction: "2025년 2월 10일까지 납부",
        entities: {
          dates: ["2025-02-10"],
          amounts: ["200,000원"],
        },
      },
      actions: [
        {
          id: "action-4",
          title: "과태료 납부하기",
          description: "온라인 또는 경찰서에서 납부할 수 있습니다.",
          deadline: "2025-02-10",
          locationType: "offline",
          locationName: "경찰서",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-4",
          type: "penalty",
          severity: "critical",
          title: "납부 기한 경과 시 가산금 및 추가 조치",
          message: "기한 내 납부하지 않으면 가산금이 부과되고 추가 조치가 취해질 수 있습니다.",
          deadline: "2025-02-10",
          amount: "가산금 약 30%",
        },
      ],
      meta: {
        parsedAt: getPastDate(8),
        confidence: 96,
        language: "ko",
      },
    },
  },
  // Community Documents
  {
    id: "mock-doc-5",
    fileName: "주민센터_민원신청_안내문.pdf",
    fileType: "application/pdf",
    fileSize: 189440,
    uploadedAt: getPastDate(15),
    filePath: "/data/uploads/mock-community-1.pdf",
    parsed: {
      documentId: "mock-doc-5",
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
          id: "action-5",
          title: "주민센터 방문 또는 온라인 신청",
          description: "가까운 주민센터를 방문하거나 정부24에서 온라인으로 신청할 수 있습니다.",
          deadline: "2025-02-15",
          locationType: "offline",
          locationName: "주민센터",
          requiredDocs: ["주민등록등본", "신분증"],
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-5",
          type: "deadline",
          severity: "medium",
          title: "신청 기한 경과 시 재신청 필요",
          message: "기한 내 신청하지 않으면 다음 기회까지 기다려야 할 수 있습니다.",
          deadline: "2025-02-15",
        },
      ],
      meta: {
        parsedAt: getPastDate(15),
        confidence: 92,
        language: "ko",
      },
    },
  },
  {
    id: "mock-doc-6",
    fileName: "건강검진_안내문.jpg",
    fileType: "image/jpeg",
    fileSize: 234567,
    uploadedAt: getPastDate(20),
    filePath: "/data/uploads/mock-health-1.jpg",
    parsed: {
      documentId: "mock-doc-6",
      summary: {
        bullets: [
          "2025년 무료 건강검진 안내",
          "신청 기한: 2025년 3월 1일까지",
          "대상: 만 40세 이상",
          "검진 일정: 2025년 3월 10일 ~ 3월 20일",
        ],
        docType: "건강검진 안내문",
        tone: "friendly",
        mainSubject: "건강검진 신청",
        mainAction: "2025년 3월 1일까지 신청",
        entities: {
          dates: ["2025-03-01", "2025-03-10", "2025-03-20"],
          places: ["보건소"],
        },
      },
      actions: [
        {
          id: "action-6",
          title: "건강검진 신청하기",
          description: "온라인 또는 보건소에서 신청할 수 있습니다.",
          deadline: "2025-03-01",
          locationType: "online",
          locationName: "정부24",
          completed: false,
        },
      ],
      risks: [],
      meta: {
        parsedAt: getPastDate(20),
        confidence: 90,
        language: "ko",
      },
    },
  },
  {
    id: "mock-doc-7",
    fileName: "재산세_고지서.pdf",
    fileType: "application/pdf",
    fileSize: 198765,
    uploadedAt: getPastDate(1),
    filePath: "/data/uploads/mock-tax-3.pdf",
    parsed: {
      documentId: "mock-doc-7",
      summary: {
        bullets: [
          "2024년 재산세 납부 안내",
          "납부 기한: 2025년 4월 30일까지",
          "납부 금액: 350,000원",
          "분할 납부 가능",
        ],
        docType: "세금고지서",
        tone: "formal",
        mainSubject: "재산세 납부",
        mainAction: "2025년 4월 30일까지 납부",
        entities: {
          dates: ["2025-04-30"],
          amounts: ["350,000원"],
        },
      },
      actions: [
        {
          id: "action-7",
          title: "재산세 납부하기",
          description: "온라인 또는 은행에서 납부할 수 있습니다. 분할 납부도 가능합니다.",
          deadline: "2025-04-30",
          locationType: "online",
          locationName: "정부24",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-7",
          type: "deadline",
          severity: "medium",
          title: "납부 기한 경과 시 가산세 부과",
          message: "기한 내 납부하지 않으면 가산세가 부과됩니다.",
          deadline: "2025-04-30",
        },
      ],
      meta: {
        parsedAt: getPastDate(1),
        confidence: 94,
        language: "ko",
      },
    },
  },
  {
    id: "mock-doc-8",
    fileName: "교통위반_과태료_통지서.png",
    fileType: "image/png",
    fileSize: 167890,
    uploadedAt: getPastDate(3),
    filePath: "/data/uploads/mock-traffic-1.png",
    parsed: {
      documentId: "mock-doc-8",
      summary: {
        bullets: [
          "교통 위반 과태료 통지",
          "납부 기한: 2025년 1월 25일까지",
          "납부 금액: 60,000원",
          "온라인 납부 가능",
        ],
        docType: "과태료 통지",
        tone: "formal",
        mainSubject: "교통 위반 과태료",
        mainAction: "2025년 1월 25일까지 납부",
        entities: {
          dates: ["2025-01-25"],
          amounts: ["60,000원"],
        },
      },
      actions: [
        {
          id: "action-8",
          title: "과태료 납부하기",
          description: "온라인으로 납부할 수 있습니다.",
          deadline: "2025-01-25",
          locationType: "online",
          locationName: "정부24",
          completed: false,
        },
      ],
      risks: [
        {
          id: "risk-8",
          type: "penalty",
          severity: "high",
          title: "납부 기한 경과 시 가산금 부과",
          message: "기한 내 납부하지 않으면 가산금이 부과됩니다.",
          deadline: "2025-01-25",
          amount: "가산금 약 20%",
        },
      ],
      meta: {
        parsedAt: getPastDate(3),
        confidence: 97,
        language: "ko",
      },
    },
  },
];

// Mock Calendar Events
export interface MockCalendarEvent {
  id: string;
  title: string;
  deadline: string;
  type: "action" | "risk" | "custom";
  documentId?: string;
  documentName?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export const mockCalendarEvents: MockCalendarEvent[] = [
  {
    id: "mock-cal-1",
    title: "종합소득세 납부",
    deadline: getDateString(150), // ~5 months from now
    type: "action",
    documentId: "mock-doc-1",
    documentName: "2024년_종합소득세_고지서.pdf",
    description: "홈택스에서 종합소득세를 신고하고 납부하세요.",
    severity: "high",
  },
  {
    id: "mock-cal-2",
    title: "주차위반 과태료 납부",
    deadline: getDateString(-5), // Overdue
    type: "risk",
    documentId: "mock-doc-3",
    documentName: "주차위반_과태료_통지서.pdf",
    description: "과태료 납부 기한이 경과했습니다. 가산금이 부과될 수 있습니다.",
    severity: "critical",
  },
  {
    id: "mock-cal-3",
    title: "지방세 납부",
    deadline: getDateString(60), // ~2 months from now
    type: "action",
    documentId: "mock-doc-2",
    documentName: "2024년_지방세_고지서.jpg",
    description: "온라인 또는 은행 창구에서 납부할 수 있습니다.",
    severity: "medium",
  },
  {
    id: "mock-cal-4",
    title: "음주운전 과태료 납부",
    deadline: getDateString(30), // ~1 month from now
    type: "risk",
    documentId: "mock-doc-4",
    documentName: "음주운전_과태료_통지서.pdf",
    description: "기한 내 납부하지 않으면 가산금이 부과됩니다.",
    severity: "critical",
  },
  {
    id: "mock-cal-5",
    title: "주민센터 민원 신청",
    deadline: getDateString(45), // ~1.5 months from now
    type: "action",
    documentId: "mock-doc-5",
    documentName: "주민센터_민원신청_안내문.pdf",
    description: "주민센터 방문 또는 온라인으로 신청하세요.",
    severity: "medium",
  },
  {
    id: "mock-cal-6",
    title: "건강검진 신청",
    deadline: getDateString(20), // ~3 weeks from now
    type: "action",
    documentId: "mock-doc-6",
    documentName: "건강검진_안내문.jpg",
    description: "온라인 또는 보건소에서 신청할 수 있습니다.",
    severity: "low",
  },
  {
    id: "mock-cal-7",
    title: "재산세 납부",
    deadline: getDateString(120), // ~4 months from now
    type: "action",
    documentId: "mock-doc-7",
    documentName: "재산세_고지서.pdf",
    description: "온라인 또는 은행에서 납부할 수 있습니다.",
    severity: "medium",
  },
  {
    id: "mock-cal-8",
    title: "교통위반 과태료 납부",
    deadline: getDateString(10), // ~1.5 weeks from now
    type: "risk",
    documentId: "mock-doc-8",
    documentName: "교통위반_과태료_통지서.png",
    description: "기한 내 납부하지 않으면 가산금이 부과됩니다.",
    severity: "high",
  },
  {
    id: "mock-cal-9",
    title: "개인 맞춤 일정",
    deadline: getDateString(7), // Next week
    type: "custom",
    documentName: "사용자 일정",
    description: "중요한 개인 일정입니다.",
    severity: "medium",
  },
];

// Helper function to check if mock data should be used
export const shouldUseMockData = (): boolean => {
  // Use mock data in development or when API fails
  if (typeof window === "undefined") return false;
  
  // Check for query parameter to force mock data
  const params = new URLSearchParams(window.location.search);
  if (params.get("mock") === "true") {
    return true;
  }
  
  // Check localStorage flag
  const useMock = localStorage.getItem("clearguide_use_mock_data");
  return useMock === "true";
};

