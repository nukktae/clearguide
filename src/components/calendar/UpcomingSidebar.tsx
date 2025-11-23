"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { formatDeadlineWithDays } from "@/src/lib/utils/calendar";

interface UpcomingSidebarProps {
  events: Array<{
    id: string;
    title: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentName: string;
    documentId: string;
  }>;
  onEventClick: (documentId: string) => void;
  onDateClick: (date: Date) => void;
}

export function UpcomingSidebar({
  events,
  onEventClick,
  onDateClick,
}: UpcomingSidebarProps) {
  const t = useTranslations();
  const locale = typeof window !== "undefined" ? document.documentElement.lang || "ko" : "ko";
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
      month: "long",
      day: "numeric",
    });
  };

  const urgencyColors = {
    critical: "text-red-600 dark:text-red-400",
    high: "text-orange-600 dark:text-orange-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    low: "text-blue-600 dark:text-blue-400",
    action: "text-gray-600 dark:text-gray-400",
  };

  const topEvents = events.slice(0, 3);

  if (topEvents.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
          {t("calendar.upcomingSchedule")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => {
              const eventDate = new Date(event.deadline);
              onDateClick(eventDate);
            }}
            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#1A1A1A] dark:text-gray-100 text-sm flex-1 group-hover:text-[#1C2329] dark:group-hover:text-blue-400 transition-colors">
                {event.title}
              </h4>
              <ArrowRight className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6D6D6D] dark:text-gray-400">
              <div className={`flex items-center gap-1 ${urgencyColors[event.urgency]}`}>
                <CalendarIcon className="h-3 w-3" />
                <span>{formatDate(event.deadline)}</span>
              </div>
              <span className="text-xs font-medium">
                {formatDeadlineWithDays(event.deadline)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#6D6D6D] dark:text-gray-400">
              <FileText className="h-3 w-3" />
              <span className="truncate">{event.documentName}</span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

