"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import ReactMarkdown from "react-markdown";

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
            <div className={cn(
              "text-sm leading-relaxed",
              isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
            )}>
              <ReactMarkdown
                components={{
                  // Style headings
                  h1: ({ node, ...props }) => (
                    <h1 className={cn(
                      "text-base font-semibold mt-2 mb-1",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className={cn(
                      "text-sm font-semibold mt-2 mb-1",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className={cn(
                      "text-sm font-semibold mt-2 mb-1",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  // Style paragraphs
                  p: ({ node, ...props }) => (
                    <p className={cn(
                      "mb-2 last:mb-0",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  // Style bold text
                  strong: ({ node, ...props }) => (
                    <strong className={cn(
                      "font-semibold",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  // Style lists
                  ul: ({ node, ...props }) => (
                    <ul className={cn(
                      "list-disc list-inside mb-2 space-y-1 ml-2",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className={cn(
                      "list-decimal list-inside mb-2 space-y-1 ml-2",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className={cn(
                      "ml-2",
                      isUser ? "text-white" : "text-[#1A1A1A] dark:text-gray-100"
                    )} {...props} />
                  ),
                  // Style code
                  code: ({ node, inline, ...props }: any) => 
                    inline ? (
                      <code className={cn(
                        "px-1 py-0.5 rounded text-xs",
                        isUser 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-100 dark:bg-gray-700 text-[#1A1A1A] dark:text-gray-100"
                      )} {...props} />
                    ) : (
                      <code className={cn(
                        "block p-2 rounded text-xs overflow-x-auto",
                        isUser 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-100 dark:bg-gray-700 text-[#1A1A1A] dark:text-gray-100"
                      )} {...props} />
                    ),
                  // Style links
                  a: ({ node, ...props }) => (
                    <a className={cn(
                      "underline",
                      isUser 
                        ? "text-blue-200 hover:text-blue-100" 
                        : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    )} {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
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

