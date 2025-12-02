"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { DocumentRow } from "./DocumentRow";

interface DocumentTableProps {
  documents: DocumentRecord[];
  onView: (id: string) => void;
  onSummary?: (id: string) => void;
  onActionGuide?: (id: string) => void;
  onAddToCalendar?: (id: string) => void;
  onRename?: (id: string, newName: string) => Promise<void>;
}

export function DocumentTable({
  documents,
  onView,
  onSummary,
  onActionGuide,
  onAddToCalendar,
  onRename,
}: DocumentTableProps) {
  const t = useTranslations();
  
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Mobile-friendly wrapper with horizontal scroll */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] sm:min-w-0">
          {/* Table Header */}
          <div className="grid grid-cols-[minmax(200px,1fr)_minmax(80px,auto)_minmax(80px,auto)] md:grid-cols-[minmax(200px,1fr)_minmax(150px,auto)_minmax(120px,auto)_minmax(80px,auto)_minmax(100px,auto)_minmax(160px,auto)] gap-3 md:gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="font-medium text-sm text-[#1A1A1A] dark:text-gray-100 flex items-center h-5">
          {t("documentTable.fileName")}
        </div>
        <div className="hidden md:flex font-medium text-sm text-[#1A1A1A] dark:text-gray-100 items-center h-5">
          {t("documentTable.documentType")}
        </div>
        <div className="hidden md:flex font-medium text-sm text-[#1A1A1A] dark:text-gray-100 items-center h-5">
          {t("documentTable.uploadDate")}
        </div>
        <div className="font-medium text-sm text-[#1A1A1A] dark:text-gray-100 flex items-center justify-center h-5">
          {t("documentTable.analysisStatus")}
        </div>
        <div className="font-medium text-sm text-[#1A1A1A] dark:text-gray-100 flex items-center h-5">
          {t("documentTable.warnings")}
        </div>
        <div className="hidden md:flex font-medium text-sm text-[#1A1A1A] dark:text-gray-100 items-center justify-end h-5">
          {t("documentTable.actions")}
        </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {documents.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            onView={onView}
            onSummary={onSummary}
            onActionGuide={onActionGuide}
            onAddToCalendar={onAddToCalendar}
            onRename={onRename}
          />
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

