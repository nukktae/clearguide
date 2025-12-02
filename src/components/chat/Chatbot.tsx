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
  onDocumentUploaded?: (documentId: string, documentName: string) => void;
}

export function Chatbot({ documentContext, onDocumentUploaded }: ChatbotProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const pathname = usePathname();

  // Load conversation messages when conversationId changes
  React.useEffect(() => {
    if (conversationId && isOpen) {
      loadConversation(conversationId);
    }
  }, [conversationId, isOpen]);

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/app/api/chat?conversationId=${convId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          // Convert API messages to ChatMessage format
          const chatMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(chatMessages);
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSendMessage = async (message: string, file?: File, fileDocumentId?: string) => {
    if (!message.trim() && !file) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message || (file ? `📎 ${file.name}` : ""),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response: Response;
      
      if (file) {
        // Send with file attachment using FormData
        const formData = new FormData();
        formData.append("message", message || "");
        formData.append("file", file);
        if (conversationId) {
          formData.append("conversationId", conversationId);
        }
        if (fileDocumentId) {
          formData.append("documentId", fileDocumentId);
        } else if (documentContext?.documentId) {
          formData.append("documentId", documentContext.documentId);
        }
        
        console.log("[Chatbot] Sending message with file:", { 
          hasConversationId: !!conversationId,
          hasDocumentId: !!fileDocumentId || !!documentContext?.documentId,
          fileName: file.name
        });

        response = await fetch("/app/api/chat", {
          method: "POST",
          body: formData,
        });
      } else {
        // Send JSON without file
        const requestBody = {
          message,
          conversationId: conversationId || undefined,
          documentId: documentContext?.documentId,
        };
        
        console.log("[Chatbot] Sending message:", { 
          hasConversationId: !!conversationId,
          hasDocumentId: !!documentContext?.documentId 
        });

        response = await fetch("/app/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log("[Chatbot] Response status:", response.status, response.statusText);

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = "메시지 전송에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = "로그인이 필요합니다. 페이지를 새로고침해주세요.";
          } else if (response.status === 404) {
            errorMessage = errorData.error || "대화를 찾을 수 없습니다.";
          } else if (response.status === 500) {
            errorMessage = errorData.error || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          }
        } catch {
          // If response is not JSON, use status text
          if (response.status === 401) {
            errorMessage = "로그인이 필요합니다. 페이지를 새로고침해주세요.";
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update conversation ID if this is a new conversation
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        // Add AI response to messages
      const aiMessage: ChatMessage = {
          id: data.message.id,
          role: data.message.role,
          content: data.message.content,
          timestamp: new Date(data.message.timestamp),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "응답을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error 
          ? `죄송합니다. ${error.message}` 
          : "죄송합니다. 메시지를 전송하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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

  const handleDocumentUploaded = async (documentId: string, documentName: string) => {
    // Update document context
    if (onDocumentUploaded) {
      onDocumentUploaded(documentId, documentName);
    }
    
    // Create a new conversation for the uploaded document
    try {
      const response = await fetch("/app/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
          documentName: documentName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversationId) {
          setConversationId(data.conversationId);
          // Load the conversation messages
          await loadConversation(data.conversationId);
        }
      }
    } catch (error) {
      console.error("Failed to create conversation for uploaded document:", error);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    
    // Create a new conversation if we don't have one and have document context
    if (!conversationId && documentContext) {
      try {
        const response = await fetch("/app/api/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: documentContext.documentId,
            documentName: documentContext.documentName,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.conversationId) {
            setConversationId(data.conversationId);
          }
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }
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
        onDocumentUploaded={handleDocumentUploaded}
      />
    </>
  );
}

