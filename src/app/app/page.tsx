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
  const router = useRouter();
  const t = useTranslations("common");

  React.useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    try {
      const response = await fetch("/app/api/documents");
      if (response.ok) {
        const data = await response.json();
        // Get most recent 5 documents
        const sorted = (data.documents || []).sort(
          (a: DocumentRecord, b: DocumentRecord) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setRecentDocuments(sorted.slice(0, 5));
      }
    } catch (err) {
      // Silently fail - recent documents are optional
      console.error("Failed to load recent documents:", err);
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
      setUploadProgress(25);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/app/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "업로드 실패");
      }

      const uploadData = await uploadResponse.json();
      setCurrentStep(1);
      setUploadProgress(50);

      // Step 2: Parse document (OCR + Analysis)
      setCurrentStep(2);
      const parseResponse = await fetch("/app/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: uploadData.documentId,
          rawText: uploadData.ocrResult.text,
        }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || "문서 분석 실패");
      }

      const parseData = await parseResponse.json();
      setCurrentStep(3);
      setUploadProgress(75);

      // Step 3: Save document
      const saveResponse = await fetch("/app/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: uploadData.document,
          parsedDocument: parseData.parsedDocument,
        }),
      });

      if (!saveResponse.ok) {
        console.warn("Failed to save document, but parsing succeeded");
      }

      setUploadProgress(100);
      setParsedDocument(parseData.parsedDocument);

      // Redirect to document detail page
      setTimeout(() => {
        router.push(`/app/document/${uploadData.documentId}`);
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
    <div className="max-w-[1150px] mx-auto">
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - Main Content (800-900px) */}
        <div className="flex-1 w-full lg:max-w-[900px] space-y-8">
          {/* Upload Card */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">
            {t("uploadDocument")}
          </h1>
        <div className="w-full max-w-2xl">
            <UploadCard
              file={file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              progress={isProcessing ? uploadProgress : undefined}
            />
            </div>
            </div>

          {/* Processing Stepper */}
          {isProcessing && (
              <div className="p-12 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#ECEEF3] dark:border-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
                <ParsingStepper steps={parsingSteps} currentStep={currentStep} />
            </div>
          )}

          {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
                <p className="font-medium">{t("common.errorOccurred")}</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

          {/* Recent Documents */}
          <RecentDocuments documents={recentDocuments} maxItems={5} />
          </div>

        {/* Right Column - Sidebar (280-340px) */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-5 lg:sticky lg:top-20 lg:mt-11">
          {/* AI Assistant Widget */}
          <AIAssistantWidget />

          {/* Useful Links Card */}
          <UsefulLinksCard />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-32 pt-12 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-[#9BA0A7] dark:text-gray-500">
          <Link href="/terms" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
            이용약관
          </Link>
          <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
          <Link href="/privacy" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
          <Link href="/contact" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
            문의하기
          </Link>
        </div>
      </footer>
    </div>
  );
}

