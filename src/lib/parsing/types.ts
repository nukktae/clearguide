export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  rawText?: string;
  filePath?: string; // Path to stored file in /data/uploads/
}

export interface Summary {
  bullets: string[];
  docType: string;
  tone: "formal" | "friendly";
  mainSubject?: string;
  mainAction?: string;
  suggestedFileName?: string; // AI-suggested descriptive filename
  entities?: {
    dates?: string[];
    names?: string[];
    places?: string[];
    amounts?: string[];
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  locationType?: "online" | "offline" | "phone" | "mail" | null;
  locationName?: string;
  requiredDocs?: string[];
  notes?: string;
  completed?: boolean;
  websiteUrl?: string; // URL for online actions
  bankAccount?: {
    accountHolder?: string; // 예금주
    bankName?: string; // 은행명
    accountNumber?: string; // 계좌번호
    giroNumber?: string; // 지로번호
  };
}

export interface RiskAlert {
  id: string;
  type: "penalty" | "benefitCancellation" | "eligibilityLoss" | "deadline" | "other";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  deadline?: string;
  amount?: string;
  conditions?: string[];
}

export interface ParsedDocument {
  documentId: string;
  summary: Summary;
  actions: ChecklistItem[];
  risks: RiskAlert[];
  eligibilityHints?: string[];
  meta: {
    parsedAt: string;
    confidence?: number;
    language?: string;
  };
}

export interface DocumentRecord extends Document {
  parsed?: ParsedDocument;
}

