"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils/cn";

interface EventDotProps {
  urgency: "critical" | "high" | "medium" | "low" | "action";
  count?: number;
  className?: string;
}

export function EventDot({ urgency, count, className }: EventDotProps) {
  const colorClasses = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
    action: "bg-gray-500",
  };

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        colorClasses[urgency],
        className
      )}
      title={count && count > 1 ? `${count}개의 일정` : undefined}
    />
  );
}

