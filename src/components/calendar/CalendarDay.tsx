"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils/cn";
import { EventDot } from "./EventDot";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Array<{
    id: string;
    title: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
  }>;
  onClick: (date: Date, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  events,
  onClick,
}: CalendarDayProps) {
  const dayNumber = date.getDate();
  const hasEvents = events.length > 0;

  // Get unique urgency levels for dots
  const urgencyLevels = Array.from(
    new Set(events.map((e) => e.urgency))
  ) as Array<"critical" | "high" | "medium" | "low" | "action">;

  const getDateKey = () => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <button
      onClick={(e) => onClick(date, e)}
      data-date={getDateKey()}
      className={cn(
        "relative min-h-[80px] md:min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#1A2A4F] dark:hover:border-blue-400",
        !isCurrentMonth && "opacity-30",
        isToday && "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
      )}
    >
      <div
        className={cn(
          "text-sm font-medium mb-1",
          isToday
            ? "text-blue-600 dark:text-blue-400"
            : "text-[#1A1A1A] dark:text-gray-100"
        )}
      >
        {dayNumber}
      </div>
      {hasEvents && (
        <div className="flex flex-wrap gap-1 mt-1">
          {urgencyLevels.slice(0, 3).map((urgency, index) => (
            <EventDot key={index} urgency={urgency} />
          ))}
          {urgencyLevels.length > 3 && (
            <span className="text-xs text-[#6D6D6D] dark:text-gray-400">
              +{urgencyLevels.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

