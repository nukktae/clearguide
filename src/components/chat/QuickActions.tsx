"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils/cn";

export type QuickActionType =
  | "tax-question"
  | "community-info"
  | "deadline-explanation"
  | "todo-summary"
  | "simple-explanation"
  | "document-summary"
  | "key-points"
  | "elder-friendly";

interface QuickActionsProps {
  onActionClick: (action: QuickActionType) => void;
  context?: "document" | "general";
}

const generalActions: Array<{ id: QuickActionType; label: string }> = [
  { id: "tax-question", label: "세금/과태료 질문하기" },
  { id: "community-info", label: "주민센터 정보 찾기" },
  { id: "deadline-explanation", label: "기한 설명 듣기" },
];

const documentActions: Array<{ id: QuickActionType; label: string }> = [
  { id: "document-summary", label: "한 줄 요약" },
  { id: "key-points", label: "핵심만" },
  { id: "elder-friendly", label: "쉽게 설명" },
];

export function QuickActions({
  onActionClick,
  context = "general",
}: QuickActionsProps) {
  const actions = context === "document" ? documentActions : generalActions;

  return (
    <div className="overflow-x-auto px-4 py-1.5 shrink-0">
      <div className="flex gap-1.5 min-w-max">
        {actions.slice(0, 3).map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            className={cn(
              "px-2.5 py-0.5 text-[11px] font-normal rounded-full transition-colors whitespace-nowrap shrink-0",
              "bg-transparent text-[#6B7280] dark:text-gray-400",
              "hover:bg-gray-50 dark:hover:bg-gray-800/50",
              "border border-[#E5E7EB] dark:border-gray-700"
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

