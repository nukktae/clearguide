"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { FloatingChatButton } from "./FloatingChatButton";
import { ChatDrawer } from "./ChatDrawer";
import type { ChatMessage } from "./ChatMessages";
import { QuickActionType } from "./QuickActions";

interface ChatbotProps {
  documentContext?: {
    documentId: string;
    documentName: string;
  } | null;
}

export function Chatbot({ documentContext }: ChatbotProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "네, 도와드리겠습니다. (이 기능은 곧 실제 AI와 연결됩니다.)",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = async (action: QuickActionType) => {
    const actionMessages: Record<QuickActionType, string> = {
      "tax-question": "세금이나 과태료에 대해 무엇이 궁금하신가요?",
      "community-info": "주민센터 정보를 찾고 계신가요? 어떤 지역인가요?",
      "deadline-explanation": "기한에 대해 설명해드리겠습니다. 어떤 문서의 기한이 궁금하신가요?",
      "todo-summary": "문서에서 해야 할 일을 정리해드리겠습니다.",
      "simple-explanation": "쉽게 설명해드리겠습니다. 어떤 부분이 궁금하신가요?",
      "document-summary": "문서를 한 줄로 요약해드리겠습니다.",
      "key-points": "핵심만 간단히 정리해드리겠습니다.",
      "elder-friendly": "어르신도 쉽게 이해하실 수 있도록 설명해드리겠습니다.",
    };

    await handleSendMessage(actionMessages[action]);
  };

  const handleStartDocumentAnalysis = () => {
    setIsOpen(false);
    // Navigate will be handled by the button's onClick
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleOpenChatEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener("openChat", handleOpenChatEvent);
    return () => {
      window.removeEventListener("openChat", handleOpenChatEvent);
    };
  }, []);

  // Don't show on login/signup pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <FloatingChatButton onClick={handleOpen} isOpen={isOpen} />
      )}
      <ChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        messages={messages}
        isLoading={isLoading}
        documentContext={documentContext}
        onSendMessage={handleSendMessage}
        onQuickAction={handleQuickAction}
        onStartDocumentAnalysis={handleStartDocumentAnalysis}
      />
    </>
  );
}

