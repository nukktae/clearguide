"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Alert } from "@/src/components/common/Alert";
import { RiskAlert } from "@/src/lib/parsing/types";
import { Calendar, Plus } from "lucide-react";
import { formatDeadlineWithDays, parseDeadline, getDeadlineStatus } from "@/src/lib/utils/calendar";
import { useRouter } from "next/navigation";
import { getIdToken } from "@/src/lib/firebase/auth";

export interface RiskAlertBoxProps {
  risks: RiskAlert[];
  documentId?: string;
  documentName?: string;
}

export function RiskAlertBox({ risks, documentId, documentName }: RiskAlertBoxProps) {
  const t = useTranslations("risks");
  const router = useRouter();
  const [isAddingToCalendar, setIsAddingToCalendar] = React.useState<string | null>(null);

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

  const handleAddToCalendar = async (risk: RiskAlert) => {
    if (!risk.deadline) return;
    
    setIsAddingToCalendar(risk.id);

    try {
      // Determine urgency based on severity and deadline status
      const deadlineStatus = getDeadlineStatus(risk.deadline);
      let urgency: "critical" | "high" | "medium" | "low" | "action" = risk.severity as any;
      
      if (deadlineStatus === "overdue") {
        urgency = "critical";
      } else if (deadlineStatus === "soon" || risk.severity === "critical") {
        urgency = "high";
      } else if (risk.severity === "high") {
        urgency = "high";
      } else if (risk.severity === "medium") {
        urgency = "medium";
      } else {
        urgency = "low";
      }

      // Format deadline as YYYY-MM-DD
      const deadlineStr = risk.deadline.split("T")[0];

      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: `${risk.title} - ${getTypeLabel(risk.type)}`,
          description: risk.message,
          deadline: deadlineStr,
          urgency: urgency,
          documentId: documentId,
          documentName: documentName,
          type: "risk",
          severity: risk.severity,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "캘린더에 추가하는데 실패했습니다.");
      }

      // Redirect to calendar page
      router.push("/app/calendar");
    } catch (error) {
      console.error("Error adding to calendar:", error);
      alert(error instanceof Error ? error.message : "캘린더에 추가하는데 실패했습니다.");
    } finally {
      setIsAddingToCalendar(null);
    }
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
                  disabled={isAddingToCalendar === risk.id}
                  className="ml-1.5 flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="캘린더에 추가"
                >
                  {isAddingToCalendar === risk.id ? (
                    <>
                      <div className="h-2.5 w-2.5 border-2 border-[#2DB7A3] border-t-transparent rounded-full animate-spin" />
                      <span>추가 중...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-2.5 w-2.5" />
                      <span>캘린더에 추가</span>
                    </>
                  )}
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

