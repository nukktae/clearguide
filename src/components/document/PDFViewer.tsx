"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils/cn";
import { ParsedDocument } from "@/src/lib/parsing/types";
import { PDFJSViewer } from "./PDFJSViewer";
import { PDFHighlightOverlay, Highlight } from "./PDFHighlightOverlay";
import { PageText } from "@/src/lib/pdfjs/textExtractor";
import { matchEntities } from "@/src/lib/pdfjs/textMatcher";

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  parsedDocument?: ParsedDocument;
  className?: string;
}

export function PDFViewer({
  fileUrl,
  fileName,
  parsedDocument,
  className,
}: PDFViewerProps) {
  const [pages, setPages] = React.useState<PageText[]>([]);
  const [highlights, setHighlights] = React.useState<Highlight[]>([]);
  const [activeHighlightType, setActiveHighlightType] = React.useState<
    Highlight["type"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [scale, setScale] = React.useState(1.5);
  const [viewportHeight, setViewportHeight] = React.useState(800);

  // Handle text extraction from PDF
  const handleTextExtracted = React.useCallback((extractedPages: PageText[]) => {
    setPages(extractedPages);
  }, []);

  // Match entities to PDF text when pages and parsed document are available
  React.useEffect(() => {
    if (!parsedDocument || pages.length === 0) {
      setHighlights([]);
      return;
    }

    // Extract entities from parsed document
    const deadlines = [
      ...new Set([
        ...(parsedDocument.actions
          .map((a) => a.deadline)
          .filter(Boolean) as string[]),
        ...(parsedDocument.risks
          .map((r) => r.deadline)
          .filter(Boolean) as string[]),
      ]),
    ];

    const penalties = parsedDocument.risks
      .filter((r) => r.type === "penalty" && r.amount)
      .map((r) => r.amount as string);

    const names = parsedDocument.summary.entities?.names || [];

    const amounts = [
      ...new Set([
        ...(parsedDocument.summary.entities?.amounts || []),
        ...penalties,
      ]),
    ];

    // Extract key phrases from summary bullets
    const keyPhrases = parsedDocument.summary.bullets
      .slice(0, 3)
      .map((bullet) => bullet.substring(0, 30).replace(/[.,!?]$/, ""))
      .filter((phrase) => phrase.length > 5);

    try {
      // Match entities to PDF text
      const matches = matchEntities(
        {
          dates: deadlines,
          names: names,
          amounts: amounts,
          keyPhrases: keyPhrases,
        },
        pages
      );

      // Convert matches to highlights
      const newHighlights: Highlight[] = [];
      
      matches.forEach((matchResults, key) => {
        const [type, ...rest] = key.split(":");
        const entityText = rest.join(":");
        
        // Determine highlight type
        let highlightType: Highlight["type"] = "keyInfo";
        if (type === "date") highlightType = "deadline";
        else if (type === "name") highlightType = "name";
        else if (type === "amount") highlightType = "amount";
        else if (keyPhrases.includes(entityText)) highlightType = "keyInfo";
        
        // Take the best match (highest confidence)
        const bestMatch = matchResults[0];
        if (bestMatch && bestMatch.confidence > 0.7) {
          newHighlights.push({
            textItem: bestMatch.textItem,
            type: highlightType,
            text: entityText,
          });
        }
      });

      // Also match penalties separately
      penalties.forEach((penalty) => {
        const penaltyMatches = matchEntities({ amounts: [penalty] }, pages);
        penaltyMatches.forEach((matchResults) => {
          const bestMatch = matchResults[0];
          if (bestMatch && bestMatch.confidence > 0.7) {
            newHighlights.push({
              textItem: bestMatch.textItem,
              type: "penalty",
              text: penalty,
            });
          }
        });
      });

      setHighlights(newHighlights);
    } catch (error) {
      console.error("Error matching entities to PDF text:", error);
      // Fallback: show empty highlights if matching fails
      setHighlights([]);
    }
  }, [parsedDocument, pages]);

  const filteredHighlights =
    activeHighlightType === "all"
      ? highlights
      : highlights.filter((h) => h.type === activeHighlightType);

  const highlightColors = {
    deadline: "rgba(59, 130, 246, 0.3)",
    penalty: "rgba(239, 68, 68, 0.3)",
    name: "rgba(168, 85, 247, 0.3)",
    amount: "rgba(245, 158, 11, 0.3)",
    keyInfo: "rgba(34, 197, 94, 0.3)",
  };

  const highlightLabels = {
    deadline: "마감일",
    penalty: "과태료",
    name: "이름",
    amount: "금액",
    keyInfo: "핵심 정보",
  };

  return (
    <div className={cn("relative", className)}>
      {/* Highlight Controls */}
      {highlights.length > 0 && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-medium text-gray-600">하이라이트:</span>
            <button
              onClick={() => setActiveHighlightType("all")}
              className={cn(
                "min-h-[44px] px-3 py-2 text-xs sm:text-sm rounded-md transition-colors touch-manipulation",
                activeHighlightType === "all"
                  ? "bg-[#1C2329] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              전체
            </button>
            {(["deadline", "penalty", "name", "amount", "keyInfo"] as const).map(
              (type) => {
                const count = highlights.filter((h) => h.type === type).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveHighlightType(type)}
                    className={cn(
                      "min-h-[44px] px-3 py-2 text-xs sm:text-sm rounded-md transition-colors flex items-center gap-1.5 touch-manipulation",
                      activeHighlightType === type
                        ? "bg-[#1C2329] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: highlightColors[type] }}
                    />
                    {highlightLabels[type]} ({count})
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer with Highlights */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
        <PDFJSViewer
          fileUrl={fileUrl}
          fileName={fileName}
          scale={scale}
          onTextExtracted={handleTextExtracted}
          onPageChange={setCurrentPage}
          onScaleChange={setScale}
          onViewportChange={setViewportHeight}
          highlightOverlay={
            filteredHighlights.length > 0 && pages.length > 0 ? (
              <PDFHighlightOverlay
                highlights={filteredHighlights}
                scale={scale}
                pageNumber={currentPage}
                viewportHeight={viewportHeight}
              />
            ) : undefined
          }
          className="w-full"
        />
      </div>

      {/* Highlight List */}
      {filteredHighlights.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">
            발견된 정보 ({filteredHighlights.length}개)
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {filteredHighlights.map((highlight, idx) => (
              <div
                key={`${highlight.textItem.pageNumber}-${idx}-${highlight.textItem.x}`}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200"
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: highlightColors[highlight.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {highlight.text}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {highlightLabels[highlight.type]} • 페이지 {highlight.textItem.pageNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      {highlights.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            💡 <strong>{highlights.length}개</strong>의 중요 정보가 문서에서 발견되었습니다. 
            하이라이트 버튼을 클릭하여 각 유형별로 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}
