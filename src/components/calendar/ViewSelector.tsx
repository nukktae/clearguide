"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

type ViewType = "calendar" | "list";

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  const t = useTranslations();
  
  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewChange("calendar")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          currentView === "calendar"
            ? "bg-white dark:bg-gray-700 text-[#1C2329] dark:text-gray-100 shadow-sm"
            : "text-[#6D6D6D] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-200"
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {t("calendar.calendarView")}
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          currentView === "list"
            ? "bg-white dark:bg-gray-700 text-[#1C2329] dark:text-gray-100 shadow-sm"
            : "text-[#6D6D6D] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-200"
        )}
      >
        <List className="h-4 w-4" />
        {t("calendar.listView")}
      </button>
    </div>
  );
}

