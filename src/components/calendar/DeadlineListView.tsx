"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/src/components/common/Card";
import {
  Calendar as CalendarIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  formatDeadlineWithDays,
  getDeadlineStatus,
} from "@/src/lib/utils/calendar";

interface DeadlineListViewProps {
  deadlines: Array<{
    id: string;
    title: string;
    deadline: string;
    type: "action" | "risk";
    documentId: string;
    documentName: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
  }>;
  onItemClick: (documentId: string) => void;
}

export function DeadlineListView({
  deadlines,
  onItemClick,
}: DeadlineListViewProps) {
  const t = useTranslations();
  const locale = typeof window !== "undefined" ? document.documentElement.lang || "ko" : "ko";
  
  const getStatusColor = (status: "overdue" | "soon" | "okay") => {
    switch (status) {
      case "overdue":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300";
      case "soon":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300";
      case "okay":
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: "overdue" | "soon" | "okay") => {
    switch (status) {
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />;
      case "soon":
        return <Clock className="h-4 w-4" />;
      case "okay":
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      {deadlines.map((item) => {
        const status = getDeadlineStatus(item.deadline);
        const statusColor = getStatusColor(status);
        const StatusIcon = getStatusIcon(status);

        return (
          <Card
            key={item.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onItemClick(item.documentId)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`shrink-0 p-1.5 rounded-lg border ${statusColor} flex items-center`}
                    >
                      {StatusIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-[#6D6D6D] dark:text-gray-400">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(item.deadline)}</span>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}
                        >
                          {formatDeadlineWithDays(item.deadline)}
                        </div>
                        {item.type === "risk" && item.severity && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.severity === "critical" || item.severity === "high"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : item.severity === "medium"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            }`}
                          >
                            {t(`calendar.severity.${item.severity}`)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-[#6D6D6D] dark:text-gray-400">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate">{item.documentName}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400 shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

