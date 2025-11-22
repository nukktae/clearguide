import * as React from "react";
import { cn } from "@/src/lib/utils/cn";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertConfig = {
  default: {
    bg: "bg-white",
    border: "border-[#6D6D6D]",
    text: "text-[#3C3C3C]",
    icon: Info,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-[#FFF3D6]",
    border: "border-[#F2B84B]",
    text: "text-[#444444]",
    icon: AlertTriangle,
    iconColor: "#D28C2E",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
};

export function Alert({
  variant = "default",
  title,
  children,
  className,
}: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;
  const isWarning = variant === "warning";
  const iconColor = (config as any).iconColor;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon 
          className="h-4 w-4 mt-0.5 shrink-0" 
          style={iconColor ? { color: iconColor } : undefined}
        />
        <div className="flex-1">
          {title && (
            <h4 className={cn(
              "mb-1 text-[13px] font-medium",
              isWarning ? "text-[#444444]" : "text-[#1A1A1A]"
            )}>{title}</h4>
          )}
          <div className={cn("text-[13px]", isWarning && "font-medium")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

