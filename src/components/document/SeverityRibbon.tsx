"use client";

import * as React from "react";
import { AlertTriangle, Clock, Info, CheckCircle2 } from "lucide-react";
import { ParsedDocument } from "@/src/lib/parsing/types";
import { cn } from "@/src/lib/utils/cn";

interface SeverityRibbonProps {
  parsedDocument: ParsedDocument;
  className?: string;
}

type SeverityLevel = "urgent" | "warning" | "info" | "safe";

interface SeverityInfo {
  level: SeverityLevel;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export function SeverityRibbon({
  parsedDocument,
  className,
}: SeverityRibbonProps) {
  const severityInfo = React.useMemo(() => {
    const now = new Date();
    const severity: SeverityInfo = {
      level: "info",
      message: "정보성 문서",
      icon: Info,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    };

    // Check for critical risks
    const criticalRisks = parsedDocument.risks.filter(
      (r) => r.severity === "critical"
    );
    if (criticalRisks.length > 0) {
      return {
        level: "urgent",
        message: "긴급: 즉시 조치 필요",
        icon: AlertTriangle,
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      };
    }

    // Check for high severity risks
    const highRisks = parsedDocument.risks.filter(
      (r) => r.severity === "high"
    );
    if (highRisks.length > 0) {
      return {
        level: "warning",
        message: "주의: 중요한 마감일이 있습니다",
        icon: AlertTriangle,
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
      };
    }

    // Check for upcoming deadlines (within 48 hours)
    const upcomingDeadlines: string[] = [];
    
    // Check action deadlines
    parsedDocument.actions.forEach((action) => {
      if (action.deadline) {
        const deadlineDate = new Date(action.deadline);
        const hoursUntilDeadline =
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 48) {
          upcomingDeadlines.push(action.deadline);
        }
      }
    });

    // Check risk deadlines
    parsedDocument.risks.forEach((risk) => {
      if (risk.deadline) {
        const deadlineDate = new Date(risk.deadline);
        const hoursUntilDeadline =
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 48) {
          upcomingDeadlines.push(risk.deadline);
        }
      }
    });

    if (upcomingDeadlines.length > 0) {
      const nearestDeadline = upcomingDeadlines.sort()[0];
      const deadlineDate = new Date(nearestDeadline);
      const hoursUntilDeadline =
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const hours = Math.floor(hoursUntilDeadline);
      
      return {
        level: "urgent",
        message: `긴급: 제출기한 임박 (${hours}시간)`,
        icon: Clock,
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      };
    }

    // Check for medium severity risks
    const mediumRisks = parsedDocument.risks.filter(
      (r) => r.severity === "medium"
    );
    if (mediumRisks.length > 0) {
      return {
        level: "warning",
        message: "정보성 문서 (주의 필요)",
        icon: Info,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
      };
    }

    // Check if there are any deadlines at all
    const hasDeadlines =
      parsedDocument.actions.some((a) => a.deadline) ||
      parsedDocument.risks.some((r) => r.deadline);
    
    if (hasDeadlines) {
      return {
        level: "info",
        message: "정보성 문서 (마감일 확인 필요)",
        icon: Info,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    }

    // Default: safe/informational
    return {
      level: "safe",
      message: "정보성 문서",
      icon: CheckCircle2,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    };
  }, [parsedDocument]);

  const Icon = severityInfo.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
        severityInfo.bgColor,
        severityInfo.textColor,
        severityInfo.borderColor,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={1.5} />
      <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
        {severityInfo.message}
      </span>
    </div>
  );
}

