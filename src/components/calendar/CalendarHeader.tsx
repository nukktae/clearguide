"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/src/components/common/Button";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAddEvent?: () => void;
}

export function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  const t = useTranslations();
  const locale = typeof window !== "undefined" ? document.documentElement.lang || "ko" : "ko";
  const monthYear = currentDate.toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100">
        {monthYear}
      </h2>
      <div className="flex items-center gap-2">
        {onAddEvent && (
          <Button
            variant="default"
            size="sm"
            onClick={onAddEvent}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            일정 추가
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousMonth}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          className="text-sm"
        >
          {t("calendar.today")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextMonth}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

