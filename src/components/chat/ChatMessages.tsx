"use client";

import * as React from "react";
import { MessageBubble, MessageRole } from "./MessageBubble";
import { QuickActions, QuickActionType } from "./QuickActions";
import { EmptyChatState } from "./EmptyChatState";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  showQuickActions?: boolean;
  quickActionContext?: "document" | "general";
  onQuickAction?: (action: QuickActionType) => void;
  onStartDocumentAnalysis?: () => void;
  documentContext?: {
    documentId: string;
    documentName: string;
  } | null;
}

export function ChatMessages({
  messages,
  isLoading = false,
  showQuickActions = true,
  quickActionContext = "general",
  onQuickAction,
  onStartDocumentAnalysis,
  documentContext,
}: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show welcome message or document context message
  const welcomeMessage = React.useMemo(() => {
    if (messages.length > 0) return null;
    
    if (documentContext) {
      return {
        id: "context",
        role: "assistant" as MessageRole,
        content: `현재 보고 있는 문서 "${documentContext.documentName}"에서 궁금하신 부분이 있나요?`,
        timestamp: new Date(),
      };
    }
    
    return {
      id: "welcome",
      role: "assistant" as MessageRole,
      content: "안녕하세요! ClearGuide AI 도우미입니다. 공공문서 관련 궁금한 점을 언제든 물어보세요.",
      timestamp: new Date(),
    };
  }, [documentContext, messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 min-h-0 max-h-[300px]">
      {messages.length === 0 && !welcomeMessage && (
        <EmptyChatState onStartDocumentAnalysis={onStartDocumentAnalysis} />
      )}
      {welcomeMessage && (
        <MessageBubble
          role={welcomeMessage.role}
          content={welcomeMessage.content}
          timestamp={welcomeMessage.timestamp}
        />
      )}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}
      {isLoading && (
        <MessageBubble
          role="assistant"
          content=""
          isLoading={true}
        />
      )}
      {showQuickActions && onQuickAction && (
        <QuickActions
          onActionClick={onQuickAction}
          context={quickActionContext}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

