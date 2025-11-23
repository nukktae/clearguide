"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export type MessageRole = "user" | "assistant" | "system";

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isLoading = false,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2 mb-2 animate-in fade-in duration-100",
        isUser && "flex-row-reverse"
      )}
    >
      {isAssistant && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-[#F7F7F8] dark:bg-gray-800 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-[#1C2329] dark:text-blue-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "inline-block px-3 py-2 rounded-2xl max-w-[75%]",
            isUser
              ? "bg-[#0D1B2A] dark:bg-blue-900 text-white"
              : "bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[#6D6D6D] dark:bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#6D6D6D] dark:bg-gray-400 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-[#6D6D6D] dark:bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
              {content}
            </p>
          )}
        </div>
        {timestamp && (
          <p
            className={cn(
              "text-xs mt-0.5",
              isUser ? "text-right text-[#6D6D6D] dark:text-gray-400" : "text-[#6D6D6D] dark:text-gray-400"
            )}
          >
            {timestamp.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

