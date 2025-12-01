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
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-[#6D6D6D] dark:text-gray-400 hover:text-[#1C2329] dark:hover:text-gray-100 transition-colors mb-4"
      >
        <span>{t("recentDocuments.title")}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
        )}
      </button>

      {isExpanded && (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3 min-w-max">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocumentClick(doc.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-2xl",
                  "bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800",
                  "hover:bg-[#F5F5F7] dark:hover:bg-[#1E293B] hover:border-gray-200 dark:hover:border-gray-700",
                  "transition-all duration-200 shrink-0",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <FileText className="h-4 w-4 text-[#2DB7A3] dark:text-[#2DB7A3] shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-[#1C2329] dark:text-gray-100 whitespace-nowrap max-w-[140px] truncate font-light">
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

