"use client";

import * as React from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { ParsedDocument, DocumentRecord } from "@/src/lib/parsing/types";
import { PDFViewer } from "./PDFViewer";

interface TabbedDocumentViewerProps {
  document: DocumentRecord;
  parsedDocument?: ParsedDocument;
  className?: string;
}

export function TabbedDocumentViewer({
  document,
  parsedDocument,
  className,
}: TabbedDocumentViewerProps) {
  const [activeTab, setActiveTab] = React.useState<"preview" | "text">("preview");
  const isPDF = document.fileType === "application/pdf";
  const isImage = document.fileType.startsWith("image/");
  const fileUrl = document.filePath ? `/app/api/files/${document.filePath}` : undefined;

  return (
    <div
      className={cn(
        "bg-white border border-[#ECEEF3] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] overflow-hidden max-w-[620px]",
        className
      )}
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTab("preview")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium transition-colors relative",
            activeTab === "preview"
              ? "text-[#1A1A1A]"
              : "text-[#6D6D6D] hover:text-[#1A1A1A]"
          )}
        >
          {isPDF || isImage ? "이미지 보기" : "문서 보기"}
          {activeTab === "preview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A2A4F]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium transition-colors relative",
            activeTab === "text"
              ? "text-[#1A1A1A]"
              : "text-[#6D6D6D] hover:text-[#1A1A1A]"
          )}
        >
          텍스트 보기
          {activeTab === "text" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A2A4F]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative bg-gray-50 h-[800px] overflow-y-auto">
        {activeTab === "preview" ? (
          <div className="flex items-center justify-center p-4 h-full">
            {fileUrl ? (
              <>
                {isPDF ? (
                  <PDFViewer
                    fileUrl={fileUrl}
                    fileName={document.fileName}
                    parsedDocument={parsedDocument}
                    className="w-full h-full"
                  />
                ) : isImage ? (
                  <img
                    src={fileUrl}
                    alt={document.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">미리보기를 사용할 수 없습니다</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8">
                {isPDF ? (
                  <>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">PDF 문서</p>
                    <p className="text-xs text-gray-400">원본 파일은 저장되지 않았습니다</p>
                  </>
                ) : isImage ? (
                  <>
                    <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">이미지 파일</p>
                    <p className="text-xs text-gray-400">원본 파일은 저장되지 않았습니다</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">문서 미리보기</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 h-full">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                OCR 미적용 (MVP)
              </span>
            </div>
            {document.rawText ? (
              <div className="bg-white rounded-lg p-4 h-[calc(100%-60px)] overflow-y-auto border border-gray-100">
                <pre className="text-[14px] text-[#4E535A] whitespace-pre-wrap font-sans leading-relaxed">
                  {document.rawText}
                </pre>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center h-[calc(100%-60px)] flex flex-col items-center justify-center border border-gray-100">
                <FileText className="h-8 w-8 text-gray-300 mb-2" strokeWidth={1.5} />
                <p className="text-[14px] text-gray-500">텍스트 추출 데이터가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

