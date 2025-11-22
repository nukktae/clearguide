"use client";

import * as React from "react";
import { Calendar, FileText, Building2, Tag, ChevronDown } from "lucide-react";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { cn } from "@/src/lib/utils/cn";

interface CollapsibleMetadataProps {
  document: DocumentRecord;
  className?: string;
}

export function CollapsibleMetadata({
  document,
  className,
}: CollapsibleMetadataProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeLabel = (fileType: string): string => {
    if (fileType === "application/pdf") return "PDF";
    if (fileType.startsWith("image/")) {
      return fileType.split("/")[1].toUpperCase();
    }
    return fileType;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsExpanded(true)}
        className="flex items-center gap-1.5 text-[13px] text-[#6D6D6D] hover:text-[#1A1A1A] transition-colors"
      >
        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>세부정보 보기</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {isExpanded && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] bg-white border border-[#ECEEF3] rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.08)] p-4 z-50"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Tag className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 mb-0.5">파일 형식</p>
                <p className="text-[13px] font-medium text-[#1A1A1A]">
                  {getFileTypeLabel(document.fileType)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 mb-0.5">파일 크기</p>
                <p className="text-[13px] font-medium text-[#1A1A1A]">
                  {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 mb-0.5">업로드 일시</p>
                <p className="text-[13px] font-medium text-[#1A1A1A]">
                  {formatDate(document.uploadedAt)}
                </p>
              </div>
            </div>
            {document.parsed?.summary.docType && (
              <div className="flex items-start gap-2.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-500 mb-0.5">문서 종류</p>
                  <p className="text-[13px] font-medium text-[#1A1A1A]">
                    {document.parsed.summary.docType}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

