"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, ArrowUpDown, List, Grid, X } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { cn } from "@/src/lib/utils/cn";

export type ViewMode = "list" | "grid";
export type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";

interface HeaderControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export function HeaderControls({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
}: HeaderControlsProps) {
  const t = useTranslations();
  const [showSortMenu, setShowSortMenu] = React.useState(false);
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  const sortOptions: Array<{ value: SortOption; labelKey: string }> = [
    { value: "date-desc", labelKey: "headerControls.sortLatest" },
    { value: "date-asc", labelKey: "headerControls.sortOldest" },
    { value: "name-asc", labelKey: "headerControls.sortNameAsc" },
    { value: "name-desc", labelKey: "headerControls.sortNameDesc" },
  ];

  const currentSortLabel =
    t(sortOptions.find((opt) => opt.value === sortOption)?.labelKey || "headerControls.sort");

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("headerControls.searchPlaceholder")}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E293B] text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#6D6D6D] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A2A4F] dark:focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">{currentSortLabel}</span>
        </Button>
        {showSortMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowSortMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSortMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    sortOption === option.value
                      ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100"
                      : "text-[#1A1A1A] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("list")}
          className={cn(
            "p-1.5 rounded transition-colors",
            viewMode === "list"
              ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100"
              : "text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "p-1.5 rounded transition-colors",
            viewMode === "grid"
              ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100"
              : "text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Grid className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

