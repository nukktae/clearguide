"use client";

import * as React from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import type { ChatMessage } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { QuickActionType } from "./QuickActions";
import { cn } from "@/src/lib/utils/cn";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: ChatMessage[];
  isLoading?: boolean;
  documentContext?: {
    documentId: string;
    documentName: string;
  } | null;
  onSendMessage: (message: string) => void;
  onQuickAction?: (action: QuickActionType) => void;
  onStartDocumentAnalysis?: () => void;
}

export function ChatDrawer({
  isOpen,
  onClose,
  onMinimize,
  messages,
  isLoading = false,
  documentContext,
  onSendMessage,
  onQuickAction,
  onStartDocumentAnalysis,
}: ChatDrawerProps) {
  const [inputValue, setInputValue] = React.useState("");

  if (!isOpen) return null;

  return (
    <>
      {/* Horizontal Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[520px] h-[400px] z-50",
          "bg-white dark:bg-[#1E293B] rounded-2xl",
          "border border-gray-200/50 dark:border-gray-700/50",
          "shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
          "flex flex-col overflow-hidden",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
          "max-w-[calc(100vw-3rem)]"
        )}
      >
        <ChatHeader onMinimize={onMinimize} onClose={onClose} />
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          showQuickActions={messages.length > 0}
          quickActionContext={documentContext ? "document" : "general"}
          onQuickAction={onQuickAction}
          onStartDocumentAnalysis={onStartDocumentAnalysis}
          documentContext={documentContext}
        />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={(message) => {
            onSendMessage(message);
            setInputValue("");
          }}
          onFileUpload={(file) => {
            // Handle file upload - you can send it as a message or upload separately
            const fileName = file.name;
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            onSendMessage(`📎 파일 첨부: ${fileName} (${fileSize}MB)`);
            // TODO: Implement actual file upload to server
          }}
          disabled={isLoading}
        />
      </div>
    </>
  );
}

