"use client";

import * as React from "react";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { Card, CardContent } from "@/src/components/common/Card";
import {
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { getDeadlineStatus } from "@/src/lib/utils/calendar";

interface DocumentGridProps {
  documents: DocumentRecord[];
  onView: (id: string) => void;
}

export function DocumentGrid({ documents, onView }: DocumentGridProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\./g, "/").replace(/\s/g, "");
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => {
        const docType = document.parsed?.summary.docType || "문서";
        const hasRisks = (document.parsed?.risks.length || 0) > 0;
        const riskCount = document.parsed?.risks.length || 0;

        const hasOverdue = document.parsed?.actions.some((action) => {
          if (!action.deadline) return false;
          const status = getDeadlineStatus(action.deadline);
          return status === "overdue";
        });

        return (
          <Card
            key={document.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onView(document.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="shrink-0">
                    <div className="rounded bg-[#F4F6F9] dark:bg-gray-800 p-2">
                      <FileText className="h-5 w-5 text-[#1A2A4F] dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A] dark:text-gray-100 truncate mb-1">
                      {document.fileName}
                    </h3>
                    <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-2">
                      {docType}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#6D6D6D] dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(document.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {(hasRisks || hasOverdue) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {hasOverdue ? (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      ⚠️ 기한 경과
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ 주의사항 {riskCount}개
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

