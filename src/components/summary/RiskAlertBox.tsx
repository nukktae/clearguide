"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Alert } from "@/src/components/common/Alert";
import { RiskAlert } from "@/src/lib/parsing/types";
import { Calendar, Plus } from "lucide-react";
import { formatDeadlineWithDays, downloadCalendarEvent, parseDeadline } from "@/src/lib/utils/calendar";

export interface RiskAlertBoxProps {
  risks: RiskAlert[];
}

export function RiskAlertBox({ risks }: RiskAlertBoxProps) {
  const t = useTranslations("risks");

  const handleAddToCalendar = (risk: RiskAlert) => {
    if (!risk.deadline) return;
    
    const deadlineDate = parseDeadline(risk.deadline);
    if (!deadlineDate) return;

    // Set time to end of day (23:59) for deadline
    deadlineDate.setHours(23, 59, 0, 0);

    downloadCalendarEvent({
      title: `${risk.title} - ${t(risk.type)}`,
      description: risk.message,
      startDate: deadlineDate,
      endDate: deadlineDate,
    });
  };

  if (risks.length === 0) {
    return null;
  }

  const getVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "warning";
      default:
        return "info";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "penalty":
        return t("penalty");
      case "benefitCancellation":
        return t("benefitCancellation");
      case "eligibilityLoss":
        return t("eligibilityLoss");
      case "deadline":
        return t("deadline");
      default:
        return t("critical");
    }
  };

  return (
    <div className="space-y-2">
      {risks.map((risk) => (
        <Alert
          key={risk.id}
          variant={getVariant(risk.severity)}
          title={`${getTypeLabel(risk.type)} - ${risk.title}`}
        >
          <div className="space-y-1.5">
            <p>{risk.message}</p>
            {risk.deadline && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium flex-wrap">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {t("deadline")}: {formatDeadlineWithDays(risk.deadline)}
                </span>
                <button
                  onClick={() => handleAddToCalendar(risk)}
                  className="ml-1.5 flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                  title="캘린더에 추가"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>캘린더에 추가</span>
                </button>
              </div>
            )}
            {risk.amount && (
              <p className="text-[13px] font-semibold">금액: {risk.amount}</p>
            )}
            {risk.conditions && risk.conditions.length > 0 && (
              <ul className="list-disc list-inside text-[13px] space-y-0.5 mt-1.5">
                {risk.conditions.map((condition, idx) => (
                  <li key={idx}>{condition}</li>
                ))}
              </ul>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
}

