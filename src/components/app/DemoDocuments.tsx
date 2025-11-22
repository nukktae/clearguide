"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { demoDocumentList } from "@/src/lib/demo/demoDocuments";
import { cn } from "@/src/lib/utils/cn";

interface DemoDocumentsProps {
  disabled?: boolean;
}

export function DemoDocuments({ disabled = false }: DemoDocumentsProps) {
  const router = useRouter();

  const handleDemoClick = (documentId: string) => {
    if (disabled) return;
    router.push(`/app/document/${documentId}`);
  };

  return (
    <div>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-4 min-w-max">
          {demoDocumentList.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleDemoClick(demo.id)}
              disabled={disabled}
              className={cn(
                "group relative p-5 rounded-[14px] border border-gray-200 dark:border-gray-700",
                "bg-white dark:bg-[#1E293B]",
                "hover:border-[#1A2A4F] dark:hover:border-blue-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                "transition-all min-w-[180px]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                  {demo.icon}
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 mb-0.5">
                    {demo.title}
                  </h4>
                  <p className="text-xs text-[#6D6D6D] dark:text-gray-400 mb-2">
                    {demo.subtitle}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-[#1A2A4F] dark:text-blue-400 group-hover:gap-1.5 transition-all">
                    <span>바로 체험하기</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
