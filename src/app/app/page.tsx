"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { UploadCard } from "@/src/components/upload/UploadCard";
import { SummaryCard } from "@/src/components/summary/SummaryCard";
import { ActionChecklist } from "@/src/components/summary/ActionChecklist";
import { RiskAlertBox } from "@/src/components/summary/RiskAlertBox";
import { EligibilityChecker } from "@/src/components/summary/EligibilityChecker";
import { Spinner } from "@/src/components/common/Spinner";
import { ParsedDocument, ChecklistItem } from "@/src/lib/parsing/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ParsingStepper } from "@/src/components/upload/ParsingStepper";
import type { ParsingStep } from "@/src/components/upload/ParsingStepper";
import { RecentDocuments } from "@/src/components/app/RecentDocuments";
import { AIAssistantWidget } from "@/src/components/app/AIAssistantWidget";
import { UsefulLinksCard } from "@/src/components/app/UsefulLinksCard";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { getIdToken } from "@/src/lib/firebase/auth";

export default function AppPage() {
  console.log("[AppPage] ===== COMPONENT RENDERING =====");
  console.log("[AppPage] File location: src/app/[locale]/app/page.tsx");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [parsedDocument, setParsedDocument] =
    React.useState<ParsedDocument | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [currentStep, setCurrentStep] = React.useState<number>(0);
  const [recentDocuments, setRecentDocuments] = React.useState<DocumentRecord[]>([]);
  const [isLoadingRecentDocs, setIsLoadingRecentDocs] = React.useState(true);
  const [recentDocsError, setRecentDocsError] = React.useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    // Wait for auth to finish loading before trying to fetch documents
    if (!authLoading) {
      if (user) {
        loadRecentDocuments();
      } else {
        // User is not authenticated - redirect to login
        router.push("/login?redirect=/app");
      }
    }
  }, [authLoading, user]);

  const loadRecentDocuments = async () => {
    try {
      setIsLoadingRecentDocs(true);
      setRecentDocsError(null);

      // Get auth token directly from Firebase Auth (more reliable than reading cookie)
      const token = await getIdToken();

      if (!token) {
        console.warn("[AppPage] No auth token available, redirecting to login");
        router.push("/login?redirect=/app");
        return;
      }

      // Include Authorization header
      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch("/app/api/documents", {
        headers,
        credentials: "include", // Ensure cookies are sent
      });
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // User is not authenticated - redirect to login
          console.warn("[AppPage] Authentication failed, redirecting to login");
          router.push("/login?redirect=/app");
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "문서 목록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      const documents = data.documents || [];
      
      // For new users, documents will be an empty array - this is expected and normal
      // Get most recent 5 documents
      if (documents.length > 0) {
        const sorted = documents.sort(
          (a: DocumentRecord, b: DocumentRecord) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setRecentDocuments(sorted.slice(0, 5));
      } else {
        // No documents - this is normal for new users
        setRecentDocuments([]);
      }
    } catch (err) {
      // Only log errors that aren't authentication-related (those redirect to login)
      if (!(err instanceof Error && err.message.includes("redirect"))) {
        console.error("[AppPage] Failed to load recent documents:", err);
        setRecentDocsError(err instanceof Error ? err.message : "문서 목록을 불러오는데 실패했습니다.");
      }
      setRecentDocuments([]);
    } finally {
      setIsLoadingRecentDocs(false);
    }
  };

  const parsingSteps: ParsingStep[] = [
    { id: "upload", label: "업로드 확인", status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "pending" },
    { id: "ocr", label: "텍스트 추출(OCR)", status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending" },
    { id: "analyze", label: "문서 분석", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending" },
    { id: "ready", label: "결과 준비", status: currentStep === 3 ? "active" : currentStep > 3 ? "completed" : "pending" },
  ];

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setParsedDocument(null);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file
      setCurrentStep(0);
      setUploadProgress(10);
      
      // Get auth token
      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다. 페이지를 새로고침해주세요.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
      };

      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/app/api/upload", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "업로드 실패");
      }

      const uploadData = await uploadResponse.json();
      const documentId = uploadData.documentId;
      setCurrentStep(1);
      setUploadProgress(30);

      // Step 2: Extract text (OCR)
      const ocrResponse = await fetch("/app/api/ocr", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
        }),
        credentials: "include",
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.error || "텍스트 추출 실패");
      }

      const ocrData = await ocrResponse.json();
      const ocrId = ocrData.ocrId;
      setCurrentStep(2);
      setUploadProgress(50);

      // Step 3: Create summary
      const summaryResponse = await fetch("/app/api/summary", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
          ocrId: ocrId,
        }),
        credentials: "include",
      });

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.error || "요약 생성 실패");
      }

      const summaryData = await summaryResponse.json();
      setUploadProgress(70);

      // Step 4: Create checklist
      const checklistResponse = await fetch("/app/api/checklist", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
          ocrId: ocrId,
        }),
        credentials: "include",
      });

      if (!checklistResponse.ok) {
        const errorData = await checklistResponse.json();
        throw new Error(errorData.error || "체크리스트 생성 실패");
      }

      const checklistData = await checklistResponse.json();
      setCurrentStep(3);
      setUploadProgress(90);

      // Step 5: Parse risks (using parse endpoint for risks only)
      const parseResponse = await fetch("/app/api/parse", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
          ocrId: ocrId,
        }),
        credentials: "include",
      });

      let risks: any[] = [];
      if (parseResponse.ok) {
        const parseData = await parseResponse.json();
        risks = parseData.parsedDocument?.risks || [];
      }

      // Combine all parsed data
      const parsedDocument: ParsedDocument = {
        documentId: documentId,
        summary: summaryData.summary,
        actions: checklistData.actions,
        risks: risks,
        meta: {
          parsedAt: new Date().toISOString(),
          confidence: 0.85,
          language: "ko",
        },
      };

      // Save parsed document back to Firestore so it's available on document detail page
      console.log("[AppPage] Saving parsed document to Firestore...");
      try {
        const saveResponse = await fetch("/app/api/documents", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: {
              id: documentId,
            },
            parsedDocument: parsedDocument,
          }),
          credentials: "include",
        });
        
        if (saveResponse.ok) {
          console.log("[AppPage] Parsed document saved successfully");
        } else {
          const errorData = await saveResponse.json().catch(() => ({}));
          console.warn("[AppPage] Failed to save parsed document:", errorData.error);
        }
      } catch (saveErr) {
        console.error("[AppPage] Error saving parsed document:", saveErr);
        // Don't fail the whole process if save fails
      }

      // Update file name with AI-suggested name if available
      const suggestedFileName = summaryData.summary?.suggestedFileName;
      if (suggestedFileName) {
        console.log("[AppPage] AI suggested file name:", suggestedFileName);
        try {
          // Get the original file extension
          const originalExt = file?.name.split('.').pop() || 'pdf';
          const newFileName = `${suggestedFileName}.${originalExt}`;
          
          const renameResponse = await fetch(`/app/api/documents/${documentId}`, {
            method: "PATCH",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: newFileName,
            }),
            credentials: "include",
          });
          
          if (renameResponse.ok) {
            console.log("[AppPage] File renamed to:", newFileName);
          } else {
            console.warn("[AppPage] Failed to rename file");
          }
        } catch (renameErr) {
          console.error("[AppPage] Error renaming file:", renameErr);
        }
      }

      setUploadProgress(100);
      setParsedDocument(parsedDocument);

      // Redirect to document detail page
      setTimeout(() => {
        router.push(`/app/document/${documentId}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    setParsedDocument(null);
    setError(null);
    setUploadProgress(0);
    setCurrentStep(0);
  };

  const handleToggleComplete = (id: string) => {
    if (!parsedDocument) return;

    const updatedActions = parsedDocument.actions.map((action) =>
      action.id === id
        ? { ...action, completed: !action.completed }
        : action
    );

    setParsedDocument({
      ...parsedDocument,
      actions: updatedActions,
    });
  };


  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start pt-8 pb-16">
        {/* Left Column - Main Content */}
        <div className="flex-1 w-full lg:max-w-[800px] space-y-10">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#1C2329] dark:text-gray-100 mb-2 tracking-tight">
                {t("uploadDocument")}
              </h1>
              <p className="text-base text-[#3C3C3C] dark:text-gray-300 font-normal">
                공공문서를 업로드하여 AI 분석을 시작하세요
              </p>
            </div>
            
            <UploadCard
              file={file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              progress={isProcessing ? uploadProgress : undefined}
            />
          </div>

          {/* Processing Stepper */}
          {isProcessing && (
            <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
              <ParsingStepper steps={parsingSteps} currentStep={currentStep} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl p-6">
              <p className="font-medium text-red-900 dark:text-red-300 mb-1">{t("errorOccurred")}</p>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Recent Documents */}
          {!isLoadingRecentDocs && recentDocuments.length > 0 && (
            <RecentDocuments documents={recentDocuments} maxItems={5} />
          )}
          {!isLoadingRecentDocs && recentDocsError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {recentDocsError}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-6 lg:sticky lg:top-24 order-first lg:order-last">
          {/* AI Assistant Widget */}
          <AIAssistantWidget />

          {/* Useful Links Card */}
          <UsefulLinksCard />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9BA0A7] dark:text-gray-500">
          <Link href="/terms" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors font-light">
            이용약관
          </Link>
          <span className="text-[#E0E0E0] dark:text-gray-700">·</span>
          <Link href="/privacy" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors font-light">
            개인정보처리방침
          </Link>
          <span className="text-[#E0E0E0] dark:text-gray-700">·</span>
          <Link href="/contact" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors font-light">
            문의하기
          </Link>
        </div>
      </footer>
    </div>
  );
}

