"use client";

import * as React from "react";
import * as pdfjsLib from "pdfjs-dist";
import { cn } from "@/src/lib/utils/cn";
import { loadPDFDocument, extractTextFromPDF, PageText } from "@/src/lib/pdfjs/textExtractor";

interface PDFJSViewerProps {
  fileUrl: string;
  fileName: string;
  scale?: number;
  onTextExtracted?: (pages: PageText[]) => void;
  onPageChange?: (page: number) => void;
  onScaleChange?: (scale: number) => void;
  onViewportChange?: (height: number) => void;
  highlightOverlay?: React.ReactNode;
  className?: string;
}

export function PDFJSViewer({
  fileUrl,
  fileName,
  scale = 1.5,
  onTextExtracted,
  onPageChange,
  onScaleChange,
  onViewportChange,
  highlightOverlay,
  className,
}: PDFJSViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [numPages, setNumPages] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentScale, setCurrentScale] = React.useState(scale);
  const [viewportHeight, setViewportHeight] = React.useState(800);

  // Load PDF on mount
  React.useEffect(() => {
    let mounted = true;

    async function loadPDF() {
      try {
        setIsLoading(true);
        setError(null);
        
        const doc = await loadPDFDocument(fileUrl);
        
        if (!mounted) return;
        
        setPdfDocument(doc);
        setNumPages(doc.numPages);
        
        // Extract text from all pages
        try {
          const pages = await extractTextFromPDF(doc);
          if (mounted && onTextExtracted) {
            onTextExtracted(pages);
          }
        } catch (textError) {
          console.warn("Could not extract text from PDF (may be scanned):", textError);
          // Continue even if text extraction fails (scanned PDFs)
          if (mounted && onTextExtracted) {
            onTextExtracted([]);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "PDF를 불러오는데 실패했습니다.");
          setIsLoading(false);
        }
      }
    }

    loadPDF();

    return () => {
      mounted = false;
    };
  }, [fileUrl, onTextExtracted]);

  // Render current page
  React.useEffect(() => {
    if (!pdfDocument || !canvasRef.current || currentPage < 1 || currentPage > numPages) {
      return;
    }

    async function renderPage() {
      if (!pdfDocument) return;
      
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale: currentScale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        setViewportHeight(viewport.height);
        if (onViewportChange) {
          onViewportChange(viewport.height);
        }
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
        setError(err instanceof Error ? err.message : "페이지를 렌더링하는데 실패했습니다.");
      }
    }

    renderPage();
  }, [pdfDocument, currentPage, currentScale, numPages]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(currentScale + 0.25, 3.0);
    setCurrentScale(newScale);
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(currentScale - 0.25, 0.5);
    setCurrentScale(newScale);
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-[800px] bg-gray-50", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C2329] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">PDF를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-[800px] bg-gray-50", className)}>
        <div className="text-center p-8">
          <p className="text-sm text-red-600 mb-2">오류 발생</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-[800px] bg-gray-50", className)} ref={containerRef}>
      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          {highlightOverlay}
        </div>
      </div>

      {/* Controls */}
      {numPages > 0 && (
        <div className="border-t border-gray-200 bg-white px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label="이전 페이지"
            >
              이전
            </button>
            <span className="text-sm text-gray-600 px-2">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={zoomOut}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
              aria-label="축소"
            >
              -
            </button>
            <span className="text-sm text-gray-600 w-12 sm:w-16 text-center">
              {Math.round(currentScale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
              aria-label="확대"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

