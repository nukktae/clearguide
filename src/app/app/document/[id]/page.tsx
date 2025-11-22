"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { SummaryCard } from "@/src/components/summary/SummaryCard";
import { ActionChecklist } from "@/src/components/summary/ActionChecklist";
import { RiskAlertBox } from "@/src/components/summary/RiskAlertBox";
import { EligibilityChecker } from "@/src/components/summary/EligibilityChecker";
import { Button } from "@/src/components/common/Button";
import { Spinner } from "@/src/components/common/Spinner";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { ArrowLeft } from "lucide-react";
import { TabbedDocumentViewer } from "@/src/components/document/TabbedDocumentViewer";
import { CollapsibleMetadata } from "@/src/components/document/CollapsibleMetadata";
import { SeverityRibbon } from "@/src/components/document/SeverityRibbon";
import { FileText as FileTextIcon } from "lucide-react";
import { demoDocuments, DEMO_TAX_ID, DEMO_COMMUNITY_ID, DEMO_PENALTY_ID } from "@/src/lib/demo/demoDocuments";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = React.useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const t = useTranslations("common");

  React.useEffect(() => {
    if (params.id) {
      loadDocument(params.id as string);
    }
  }, [params.id]);

  const loadDocument = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Handle demo documents
      if (id === DEMO_TAX_ID || id === DEMO_COMMUNITY_ID || id === DEMO_PENALTY_ID) {
        setDocument(demoDocuments[id]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/app/api/documents/${id}`);
      if (!response.ok) {
        throw new Error("문서를 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setDocument(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = (actionId: string) => {
    if (!document || !document.parsed) return;

    const updatedActions = document.parsed.actions.map((action) =>
      action.id === actionId
        ? { ...action, completed: !action.completed }
        : action
    );

    setDocument({
      ...document,
      parsed: {
        ...document.parsed,
        actions: updatedActions,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[#6D6D6D]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push("/app")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p>{error || "문서를 찾을 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  if (!document.parsed) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push("/app")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p>이 문서는 아직 분석되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/app")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <div className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-[#1A2A4F]" strokeWidth={1.5} />
                <h1 className="text-[24px] font-semibold text-[#1A1A1A]">
                  {document.fileName}
                </h1>
              </div>
              {/* Severity Ribbon as inline label */}
              {document.parsed && (
                <SeverityRibbon parsedDocument={document.parsed} />
              )}
            </div>
            {/* Collapsible Metadata */}
            <CollapsibleMetadata document={document} />
          </div>
          {document.parsed?.summary.docType && (
            <p className="text-[14px] text-[#6D6D6D] opacity-70">
              {document.parsed.summary.docType}
            </p>
          )}
        </div>
      </div>

      {/* Subtle divider before document preview */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100"></div>
        </div>
      </div>

      {/* Document Viewer & Analysis Results Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Tabbed Document Viewer */}
        <div>
          <TabbedDocumentViewer
            document={document}
            parsedDocument={document.parsed}
          />
        </div>

        {/* Right: Analysis Results */}
        <div className="space-y-6">
          {/* Risk Alerts */}
          <RiskAlertBox risks={document.parsed.risks} />

          {/* Summary */}
          <SummaryCard summary={document.parsed.summary} />

          {/* Eligibility Checker */}
          <EligibilityChecker
            eligibilityHints={document.parsed.eligibilityHints}
          />
        </div>
      </div>

      {/* Full-width Action Checklist */}
      <div className="mt-12">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[13px] font-medium text-[#6D6D6D] tracking-wide">
              해야 할 일
            </span>
          </div>
        </div>
        <ActionChecklist
          actions={document.parsed.actions}
          onToggleComplete={handleToggleComplete}
          documentText={document.rawText}
        />
      </div>
    </div>
  );
}

