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
  onSendMessage: (message: string, file?: File, fileDocumentId?: string) => void;
  onQuickAction?: (action: QuickActionType) => void;
  onStartDocumentAnalysis?: () => void;
  onDocumentUploaded?: (documentId: string, documentName: string) => void;
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
  onDocumentUploaded,
}: ChatDrawerProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [attachedDocumentId, setAttachedDocumentId] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<{
    status: "idle" | "uploading" | "processing" | "success" | "error";
    fileName?: string;
    message?: string;
  }>({ status: "idle" });

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
        {/* Upload Status Indicator */}
        {uploadStatus.status !== "idle" && (
          <div className={cn(
            "px-4 py-2 mx-4 mb-2 rounded-lg text-sm animate-in fade-in slide-in-from-top-1",
            uploadStatus.status === "uploading" || uploadStatus.status === "processing"
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              : uploadStatus.status === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}>
            <div className="flex items-center gap-2">
              {uploadStatus.status === "uploading" || uploadStatus.status === "processing" ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>
                    {uploadStatus.status === "uploading" 
                      ? `파일 업로드 중: ${uploadStatus.fileName}...`
                      : uploadStatus.message || `파일 처리 중: ${uploadStatus.fileName}...`}
                  </span>
                </>
              ) : uploadStatus.status === "success" ? (
                <>
                  <span>✓</span>
                  <span>{uploadStatus.message || `파일 "${uploadStatus.fileName}" 업로드 완료! 이제 질문을 입력하세요.`}</span>
                </>
              ) : (
                <>
                  <span>✗</span>
                  <span>{uploadStatus.message || "파일 업로드 실패"}</span>
                </>
              )}
            </div>
          </div>
        )}
        {/* Show attached file indicator */}
        {attachedFile && (
          <div className="px-4 py-2 mx-4 mb-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm flex items-center justify-between">
            <span>📎 {attachedFile.name}</span>
            <button
              onClick={() => {
                setAttachedFile(null);
                setAttachedDocumentId(null);
                setUploadStatus({ status: "idle" });
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              ✕
            </button>
          </div>
        )}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={async (message) => {
            // Send message with attached file if present
            if (attachedFile) {
              await onSendMessage(message, attachedFile, attachedDocumentId || undefined);
              setAttachedFile(null);
              setAttachedDocumentId(null);
            } else {
              onSendMessage(message);
            }
            setInputValue("");
            // Clear upload status after sending
            if (uploadStatus.status === "success") {
              setUploadStatus({ status: "idle" });
            }
          }}
          onFileUpload={async (file) => {
            // For chat attachments, just prepare the file for sending with the message
            // Don't process through OCR - send image directly to chat API
            setIsUploading(true);
            setUploadStatus({ status: "uploading", fileName: file.name });
            
            try {
              // Upload file to get documentId (needed for context)
              const formData = new FormData();
              formData.append("file", file);

              const uploadResponse = await fetch("/app/api/upload", {
                method: "POST",
                body: formData,
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || "파일 업로드 실패");
              }

              const uploadData = await uploadResponse.json();
              const documentId = uploadData.documentId;

              // Store file and documentId for sending with message
              setAttachedFile(file);
              setAttachedDocumentId(documentId);

              // Notify parent component about the uploaded document
              if (onDocumentUploaded) {
                onDocumentUploaded(documentId, file.name);
              }

              // Show success status - user can now write instructions
              setUploadStatus({ 
                status: "success", 
                fileName: file.name,
                message: `파일 "${file.name}" 첨부 완료! 질문을 입력하고 전송하세요.`
              });
              
              // Store file for sending with message
              // We'll handle this in the onSubmit handler
              
              // Auto-clear success message after 5 seconds
              setTimeout(() => {
                setUploadStatus((prev) => {
                  if (prev.status === "success") {
                    return { status: "idle" };
                  }
                  return prev;
                });
              }, 5000);
            } catch (error) {
              console.error("File upload error:", error);
              const errorMessage = error instanceof Error 
                ? error.message
                : "파일 업로드 중 오류가 발생했습니다.";
              setUploadStatus({ 
                status: "error", 
                fileName: file.name,
                message: errorMessage
              });
              
              // Auto-clear error message after 5 seconds
              setTimeout(() => {
                setUploadStatus((prev) => {
                  if (prev.status === "error") {
                    return { status: "idle" };
                  }
                  return prev;
                });
              }, 5000);
            } finally {
              setIsUploading(false);
            }
          }}
          disabled={isLoading || isUploading}
        />
      </div>
    </>
  );
}

