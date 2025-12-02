"use client";

import * as React from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function FloatingChatButton({
  onClick,
  isOpen = false,
}: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-white dark:bg-[#1E293B] shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200 touch-manipulation",
        isHovered && "scale-105 shadow-xl"
      )}
      aria-label="도움이 필요하신가요?"
      title="도움이 필요하신가요?"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6 text-[#1C2329] dark:text-blue-400" />
        <Sparkles className="h-3 w-3 text-blue-500 absolute -top-1 -right-1" />
      </div>
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#1A1A1A] dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          도움이 필요하신가요?
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1A1A1A] dark:border-t-gray-800" />
        </div>
      )}
    </button>
  );
}

