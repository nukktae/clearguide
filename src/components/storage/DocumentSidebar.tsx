"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Receipt,
  Building2,
  AlertTriangle,
  Star,
  Clock,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export type FilterType =
  | "all"
  | "tax"
  | "community"
  | "penalty"
  | "starred"
  | "overdue"
  | "pdf"
  | "image";

interface DocumentSidebarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  documentCounts?: {
    all: number;
    tax: number;
    community: number;
    penalty: number;
    starred: number;
    overdue: number;
    pdf: number;
    image: number;
  };
}

export function DocumentSidebar({
  activeFilter,
  onFilterChange,
  documentCounts,
}: DocumentSidebarProps) {
  const t = useTranslations();
  
  const filters = [
    { id: "all" as FilterType, labelKey: "documentSidebar.all", icon: FileText },
    { id: "tax" as FilterType, labelKey: "documentSidebar.tax", icon: Receipt },
    { id: "community" as FilterType, labelKey: "documentSidebar.community", icon: Building2 },
    { id: "penalty" as FilterType, labelKey: "documentSidebar.penalty", icon: AlertTriangle },
    { id: "starred" as FilterType, labelKey: "documentSidebar.starred", icon: Star },
    { id: "overdue" as FilterType, labelKey: "documentSidebar.overdue", icon: Clock },
    { id: "pdf" as FilterType, labelKey: "documentSidebar.pdf", icon: File },
    { id: "image" as FilterType, labelKey: "documentSidebar.image", icon: ImageIcon },
  ];

  return (
    <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] p-4">
      <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">
        {t("documentSidebar.title")}
      </h2>
      <nav className="space-y-1">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const count = documentCounts?.[filter.id] ?? 0;
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100 font-medium"
                  : "text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#1A1A1A] dark:hover:text-gray-100"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(filter.labelKey)}</span>
              </div>
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs shrink-0",
                    isActive
                      ? "text-white/80 dark:text-blue-200"
                      : "text-[#6D6D6D] dark:text-gray-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

