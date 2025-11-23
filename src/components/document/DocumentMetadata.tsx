"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { DocumentRecord } from "@/src/lib/parsing/types";

interface DocumentMetadataProps {
  document: DocumentRecord;
  className?: string;
}

export function DocumentMetadata({
  document,
  className,
}: DocumentMetadataProps) {
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


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Parsing Metadata */}
      {document.parsed?.meta && (
        <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[19px] font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#1C2329]" strokeWidth={1.5} />
            분석 정보
          </h3>
          <div className="space-y-3">
            {document.parsed.meta.confidence && (
              <div>
                <p className="text-[13px] text-gray-500 mb-1">신뢰도</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3EC6A8] rounded-full transition-all duration-500"
                      style={{ width: `${document.parsed.meta.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[14px] font-medium text-[#1A1A1A]">
                    {Math.round(document.parsed.meta.confidence * 100)}%
                  </span>
                </div>
              </div>
            )}
            {document.parsed.meta.language && (
              <div>
                <p className="text-[13px] text-gray-500 mb-0.5">언어</p>
                <p className="text-[14px] font-medium text-[#1A1A1A]">
                  {document.parsed.meta.language}
                </p>
              </div>
            )}
            {document.parsed.meta.parsedAt && (
              <div>
                <p className="text-[13px] text-gray-500 mb-0.5">분석 일시</p>
                <p className="text-[14px] font-medium text-[#1A1A1A]">
                  {formatDate(document.parsed.meta.parsedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

