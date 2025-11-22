import * as React from "react";
import { cn } from "@/src/lib/utils/cn";

export interface TagProps {
  variant?: "default" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-[#F4F6F9] text-[#3C3C3C]",
  success: "bg-[#2DB7A3]/10 text-[#2DB7A3]",
  warning: "bg-[#F2B84B]/10 text-[#F2B84B]",
  error: "bg-red-100 text-red-700",
};

export function Tag({
  variant = "default",
  children,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

