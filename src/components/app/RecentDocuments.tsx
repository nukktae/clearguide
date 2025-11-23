"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { cn } from "@/src/lib/utils/cn";

interface RecentDocumentsProps {
  documents: DocumentRecord[];
  maxItems?: number;
}

export function RecentDocuments({
  documents,
  maxItems = 5,
}: RecentDocumentsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const router = useRouter();
  const t = useTranslations();

  const recentDocs = documents.slice(0, maxItems);

  if (recentDocs.length === 0) {
    return null;
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/app/document/${documentId}`);
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-[#6D6D6D] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 transition-colors mb-2"
      >
        <span>{t("recentDocuments.title")}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocumentClick(doc.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  "bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700",
                  "hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#1C2329] dark:hover:border-blue-500",
                  "transition-colors shrink-0",
                  "shadow-sm"
                )}
              >
                <FileText className="h-4 w-4 text-[#1C2329] dark:text-blue-400 shrink-0" />
                <span className="text-xs text-[#1A1A1A] dark:text-gray-100 whitespace-nowrap max-w-[120px] truncate">
                  {doc.fileName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

