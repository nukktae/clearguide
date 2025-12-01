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
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#F5F5F7] dark:bg-[#1E293B] px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Bot Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-[#2DB7A3]/10 dark:bg-[#2DB7A3]/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-[#2DB7A3]" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1E293B]"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1C2329] dark:text-gray-100 leading-tight">
              {t("aiAssistant.title")}
            </h3>
            <p className="text-xs text-[#1C2329] dark:text-gray-200 mt-1 font-normal">
              {t("aiAssistant.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-[#1C2329] dark:text-gray-100 mb-6 leading-relaxed font-normal">
          {t("aiAssistant.question")}
        </p>

        {/* CTA Button */}
        <button
          onClick={() => {
            if (onStartChat) {
              onStartChat();
            } else {
              window.dispatchEvent(new CustomEvent("openChat"));
            }
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl",
            "bg-[#1C2329] dark:bg-white text-white dark:text-[#1C2329]",
            "text-sm font-medium",
            "hover:bg-[#2A3441] dark:hover:bg-gray-100",
            "transition-all duration-200",
            "shadow-sm hover:shadow-md"
          )}
        >
          <span>{t("aiAssistant.startChat")}</span>
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

