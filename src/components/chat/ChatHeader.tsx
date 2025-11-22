"use client";

import * as React from "react";
import { Minimize2, X } from "lucide-react";
import Image from "next/image";

interface ChatHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
}

export function ChatHeader({ onMinimize, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200/20 dark:border-gray-700/20 bg-white dark:bg-[#1E293B] shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative w-7 h-7 shrink-0">
          <Image
            src="/images/logos/clearguidelogo.png"
            alt="클리어가이드"
            width={28}
            height={28}
            className="rounded-full"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 leading-tight">
            ClearGuide AI 도우미
          </h3>
          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
            <span>온라인 • 지금 도와드릴게요</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onMinimize}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="최소화"
        >
          <Minimize2 className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

