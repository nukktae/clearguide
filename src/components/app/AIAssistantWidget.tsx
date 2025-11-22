"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface AIAssistantWidgetProps {
  onStartChat?: () => void;
}

export function AIAssistantWidget({ onStartChat }: AIAssistantWidgetProps) {
  const t = useTranslations();
  
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Darker Header */}
      <div className="bg-[#1A2A4F] dark:bg-blue-900/80 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Bot Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A2A4F] dark:border-blue-900/80"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight">
              {t("aiAssistant.title")}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              {t("aiAssistant.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-xs text-[#6D6D6D] dark:text-gray-400 mb-4 leading-relaxed">
          {t("aiAssistant.question")}
        </p>

        {/* Premium CTA Button */}
        <button
          onClick={() => {
            if (onStartChat) {
              onStartChat();
            } else {
              // Dispatch custom event to open chat
              window.dispatchEvent(new CustomEvent("openChat"));
            }
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg",
            "bg-gradient-to-r from-[#1A2A4F] to-[#2A3A5F] dark:from-blue-600 dark:to-blue-700",
            "text-white text-sm font-semibold",
            "hover:from-[#2A3A5F] hover:to-[#3A4A6F] dark:hover:from-blue-700 dark:hover:to-blue-800",
            "transition-all duration-200",
            "shadow-md hover:shadow-lg",
            "transform hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <span>{t("aiAssistant.startChat")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

