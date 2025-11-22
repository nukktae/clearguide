"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export interface ParsingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

interface ParsingStepperProps {
  steps: ParsingStep[];
  currentStep: number;
  className?: string;
}

export function ParsingStepper({
  steps,
  currentStep,
  className,
}: ParsingStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-10">
        {steps.map((step, index) => {
          const isActive = step.status === "active";
          const isCompleted = step.status === "completed";
          const isPending = step.status === "pending";

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-[#1A2A4F] dark:bg-blue-500 border-[#1A2A4F] dark:border-blue-500"
                      : isActive
                      ? "border-[#1A2A4F] dark:border-blue-400 bg-white dark:bg-gray-800"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 text-[#1A2A4F] dark:text-blue-400 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-4 text-[13.5px] font-medium transition-colors duration-300",
                    isCompleted || isActive
                      ? "text-[#1A2A4F] dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-6 transition-all duration-500",
                    isCompleted ? "bg-[#1A2A4F] dark:bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1A2A4F] to-[#2DB7A3] dark:from-blue-500 dark:to-teal-400 transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

