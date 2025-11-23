"use client";

import * as React from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onVoiceClick?: () => void;
  onFileUpload?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Speech Recognition types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onVoiceClick,
  onFileUpload,
  placeholder = "궁금한 내용을 입력해주세요…",
  disabled = false,
}: ChatInputProps) {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      onChange("");
    }
  };

  const startListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("음성 인식이 지원되지 않는 브라우저입니다. Chrome을 사용해주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      onChange(value + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        stopListening();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    const fileType = file.type.toLowerCase();
    const isValidType =
      allowedTypes.includes(fileType) ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg") ||
      file.name.toLowerCase().endsWith(".png");

    if (!isValidType) {
      alert("지원되는 파일 형식: PDF, JPG, PNG");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    if (onFileUpload) {
      onFileUpload(file);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-200/20 dark:border-gray-700/20 bg-white dark:bg-[#1E293B] shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAttachmentClick}
          disabled={disabled}
          className={cn(
            "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="파일 첨부"
        >
          <Paperclip className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            disabled={disabled || isListening}
            className={cn(
              "w-full px-4 py-2.5 pr-12 rounded-full border border-[#E5E7EB] dark:border-gray-700",
              "bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 text-sm",
              "placeholder:text-[#9CA3AF] dark:placeholder:text-gray-500 placeholder:text-sm",
              "focus:outline-none focus:ring-2 focus:ring-[#1C2329] dark:focus:ring-blue-500",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.2)]",
              "shadow-sm",
              (disabled || isListening) && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
        <button
          type="button"
          onClick={startListening}
          disabled={disabled}
          className={cn(
            "p-2 rounded-full transition-all shrink-0",
            isListening
              ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg shadow-blue-500/50 animate-pulse"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-[#6D6D6D] dark:text-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isListening ? "음성 인식 중지" : "음성 입력"}
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={!value.trim() || disabled || isListening}
          className={cn(
            "p-2.5 rounded-full transition-colors shrink-0 shadow-sm",
            value.trim() && !disabled && !isListening
              ? "bg-[#1C2329] dark:bg-blue-600 text-white hover:bg-[#1A3A5F] dark:hover:bg-blue-700"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
          aria-label="전송"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

