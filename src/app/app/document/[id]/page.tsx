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
import { Skeleton, ShimmerSkeleton } from "@/src/components/common/Skeleton";
import { DocumentRecord, ParsedDocument } from "@/src/lib/parsing/types";
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
    console.log("[Document Page] Loading document:", id);
    try {
      setIsLoading(true);
      
      // Handle demo documents
      if (id === DEMO_TAX_ID || id === DEMO_COMMUNITY_ID || id === DEMO_PENALTY_ID) {
        console.log("[Document Page] Loading demo document");
        setDocument(demoDocuments[id]);
        setIsLoading(false);
        return;
      }

      console.log("[Document Page] Fetching document from API...");
      const response = await fetch(`/app/api/documents/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Document Page] Document fetch failed:", errorData);
        throw new Error(errorData.error || "문서를 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      console.log("[Document Page] Document loaded:", {
        id: data.document?.id,
        fileName: data.document?.fileName,
        fileType: data.document?.fileType,
        filePath: data.document?.filePath,
        hasParsed: !!data.document?.parsed,
        allFields: Object.keys(data.document || {}),
      });
      
      // Warn if critical fields are missing (document may have been corrupted by previous save)
      if (data.document && (!data.document.fileName || !data.document.filePath)) {
        console.warn("[Document Page] Document is missing critical fields! Document may have been corrupted by a previous save. Consider re-uploading.");
      }
      
      let document = data.document;
      
      // If document doesn't have parsed data, try to fetch summary and checklist separately
      if (!document.parsed) {
        console.log("[Document Page] Document has no parsed data, fetching summary and checklist...");
        
        try {
          // Fetch summary
          const summaryResponse = await fetch(`/app/api/summary?documentId=${id}`);
          let summary = null;
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            summary = summaryData.summary?.summary || summaryData.summaries?.[0]?.summary;
            console.log("[Document Page] Summary fetched:", {
              hasSummary: !!summary,
              summaryKeys: summary ? Object.keys(summary) : [],
            });
          } else {
            const errorData = await summaryResponse.json().catch(() => ({}));
            console.warn("[Document Page] Summary fetch failed:", {
              status: summaryResponse.status,
              error: errorData.error,
            });
          }
          
          // Fetch checklist
          const checklistResponse = await fetch(`/app/api/checklist?documentId=${id}`);
          let actions = [];
          if (checklistResponse.ok) {
            const checklistData = await checklistResponse.json();
            console.log("[Document Page] Checklist API response:", {
              hasChecklist: !!checklistData.checklist,
              hasChecklists: !!checklistData.checklists,
              checklistKeys: checklistData.checklist ? Object.keys(checklistData.checklist) : [],
              rawResponse: JSON.stringify(checklistData).substring(0, 200),
            });
            actions = checklistData.checklist?.actions || checklistData.checklists?.[0]?.actions || [];
            console.log("[Document Page] Checklist fetched:", {
              actionsCount: actions.length,
              actions: actions.slice(0, 2), // Log first 2 actions
            });
          } else {
            const errorData = await checklistResponse.json().catch(() => ({}));
            console.warn("[Document Page] Checklist fetch failed:", {
              status: checklistResponse.status,
              error: errorData.error,
            });
          }
          
          // Fetch risks from parse endpoint (optional - needs ocrId)
          // For now, skip risks if we don't have ocrId (risks are optional)
          const risks: any[] = [];
          console.log("[Document Page] Skipping risks fetch - ocrId not available in document detail page");
          
          // Always create parsed document, even if empty (so we can show empty states)
          const parsedDocument: ParsedDocument = {
            documentId: id,
            summary: summary || {
              bullets: [],
              docType: "공공문서",
              tone: "friendly",
            },
            actions: actions,
            risks: risks,
            meta: {
              parsedAt: new Date().toISOString(),
              confidence: 0.85,
              language: "ko",
            },
          };
          document = {
            ...document,
            parsed: parsedDocument,
          };
          console.log("[Document Page] Combined parsed document from separate endpoints:", {
            hasSummary: !!summary,
            actionsCount: actions.length,
            risksCount: risks.length,
          });
        } catch (fetchErr) {
          console.error("[Document Page] Failed to fetch summary/checklist:", fetchErr);
          // Still create empty parsed document so page can render
          document = {
            ...document,
            parsed: {
              documentId: id,
              summary: {
                bullets: [],
                docType: "공공문서",
                tone: "friendly",
              },
              actions: [],
              risks: [],
              meta: {
                parsedAt: new Date().toISOString(),
                confidence: 0,
                language: "ko",
              },
            },
          };
        }
      }
      
      setDocument(document);
      console.log("[Document Page] Document set:", {
        hasParsed: !!document.parsed,
        hasSummary: !!document.parsed?.summary,
        hasActions: !!document.parsed?.actions,
      });
    } catch (err) {
      console.error("[Document Page] Error loading document:", err);
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
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Document Viewer Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          
          {/* Right: Analysis Results Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Checklist Skeleton */}
        <div className="mt-12 space-y-4">
          <Skeleton className="h-6 w-24 mx-auto" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-start gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ))}
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
                <FileTextIcon className="h-4 w-4 text-[#1C2329]" strokeWidth={1.5} />
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
          <RiskAlertBox 
            risks={document.parsed.risks}
            documentId={document.id}
            documentName={document.fileName}
          />

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
          documentId={document.id}
          documentName={document.fileName}
        />
      </div>
    </div>
  );
}

