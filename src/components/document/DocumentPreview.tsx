"use client";

import * as React from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { ParsedDocument } from "@/src/lib/parsing/types";
import { PDFViewer } from "./PDFViewer";

interface DocumentPreviewProps {
  fileName: string;
  fileType: string;
  filePath?: string;
  parsedDocument?: ParsedDocument;
  className?: string;
}

export function DocumentPreview({
  fileName,
  fileType,
  filePath,
  parsedDocument,
  className,
}: DocumentPreviewProps) {
  const isPDF = fileType === "application/pdf";
  const isImage = fileType.startsWith("image/");
  const fileUrl = filePath ? `/app/api/files/${filePath}` : undefined;

  return (
    <div
      className={cn(
        "bg-white border border-[#ECEEF3] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] overflow-hidden",
        className
      )}
    >
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          {isPDF ? (
            <FileText className="h-4 w-4 text-[#1A2A4F]" strokeWidth={1.5} />
          ) : (
            <ImageIcon className="h-4 w-4 text-[#1A2A4F]" strokeWidth={1.5} />
          )}
          <span className="text-sm font-medium text-[#1A1A1A] truncate">
            {fileName}
          </span>
        </div>
      </div>

      <div className="relative bg-gray-50 h-[800px] overflow-y-auto rounded-b-2xl">
        <div className="flex items-center justify-center p-4 h-full">
          {fileUrl ? (
            <>
              {isPDF ? (
                <PDFViewer
                  fileUrl={fileUrl!}
                  fileName={fileName}
                  parsedDocument={parsedDocument}
                  className="w-full h-full"
                />
              ) : isImage ? (
                <img
                  src={fileUrl}
                  alt={fileName}
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
      </div>
    </div>
  );
}

