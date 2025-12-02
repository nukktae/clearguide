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
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const errorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      onChange("");
    }
  };

  const startListening = async () => {
    console.log("[Speech Recognition] ===== START LISTENING =====");
    console.log("[Speech Recognition] Current state:", {
      isListening,
      speechRecognitionAvailable,
      disabled,
    });

    if (isListening) {
      console.log("[Speech Recognition] Already listening, stopping...");
      stopListening();
      return;
    }

    if (!speechRecognitionAvailable) {
      console.warn("[Speech Recognition] Speech recognition is disabled");
      return; // Don't try if already disabled
    }

    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    console.log("[Speech Recognition] Browser support check:", {
      hasSpeechRecognition: !!window.SpeechRecognition,
      hasWebkitSpeechRecognition: !!window.webkitSpeechRecognition,
      SpeechRecognitionAvailable: !!SpeechRecognition,
      userAgent: navigator.userAgent,
    });

    if (!SpeechRecognition) {
      console.error("[Speech Recognition] Browser does not support speech recognition");
      setSpeechRecognitionAvailable(false);
      alert("음성 인식이 지원되지 않는 브라우저입니다. Chrome을 사용해주세요.");
      return;
    }

    // Check HTTPS (Web Speech API requires secure context)
    // Note: Even on localhost, HTTP may fail due to Chrome's requirements for connecting to Google's servers
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '::1';
    const isSecureContext = window.isSecureContext || location.protocol === 'https:';
    
    console.log("[Speech Recognition] Security context:", {
      isSecureContext,
      protocol: location.protocol,
      hostname: location.hostname,
      origin: location.origin,
      isLocalhost,
      windowIsSecureContext: window.isSecureContext,
    });

    // Web Speech API requires HTTPS for reliable operation
    // Even on localhost, HTTP often fails because the service needs to connect to Google's servers
    if (location.protocol === 'http:') {
      console.error("[Speech Recognition] HTTP protocol detected - Web Speech API requires HTTPS");
      setSpeechRecognitionAvailable(false);
      setErrorMessage("음성 인식은 HTTPS 환경에서만 사용할 수 있습니다. HTTPS로 접속해주세요.");
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 10000);
      return;
    }
    
    if (!isSecureContext) {
      console.error("[Speech Recognition] Not in secure context (HTTPS required)");
      setSpeechRecognitionAvailable(false);
      setErrorMessage("음성 인식은 보안 연결(HTTPS)이 필요합니다.");
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 10000);
      return;
    }

    // Check network connectivity
    const isOnline = navigator.onLine;
    console.log("[Speech Recognition] Network status:", {
      isOnline,
      connectionType: (navigator as any).connection?.effectiveType || "unknown",
      downlink: (navigator as any).connection?.downlink || "unknown",
      rtt: (navigator as any).connection?.rtt || "unknown",
    });

    if (!isOnline) {
      console.error("[Speech Recognition] Device is offline");
      setSpeechRecognitionAvailable(false);
      setErrorMessage("오프라인 상태입니다. 인터넷 연결을 확인해주세요.");
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Check microphone permission
    let microphoneStream: MediaStream | null = null;
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Speech Recognition] Microphone permission granted");
      // Keep stream open during recognition to avoid permission issues
    } catch (permissionError: any) {
      console.error("[Speech Recognition] Microphone permission error:", {
        name: permissionError.name,
        message: permissionError.message,
      });
      setSpeechRecognitionAvailable(false);
      setErrorMessage("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      console.log("[Speech Recognition] Creating SpeechRecognition instance...");
      const recognition = new SpeechRecognition();
      
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = true;
      // Add maxAlternatives for better results
      recognition.maxAlternatives = 1;
      
      console.log("[Speech Recognition] Configuration:", {
        lang: recognition.lang,
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        maxAlternatives: recognition.maxAlternatives,
      });

      // Add timeout to detect if recognition doesn't start
      const startTimeout = setTimeout(() => {
        if (!isListening) {
          console.warn("[Speech Recognition] Recognition start timeout - may not have started");
        }
      }, 3000);

      recognition.onstart = () => {
        clearTimeout(startTimeout);
        console.log("[Speech Recognition] ✅ Recognition started successfully");
        setIsListening(true);
        // Stop microphone stream check once recognition starts
        if (microphoneStream) {
          microphoneStream.getTracks().forEach(track => track.stop());
          microphoneStream = null;
        }
      };

      recognition.onresult = (event: any) => {
        console.log("[Speech Recognition] Result received:", {
          resultIndex: event.resultIndex,
          resultsLength: event.results.length,
        });
        
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          console.log(`[Speech Recognition] Result ${i}:`, {
            transcript,
            isFinal,
            confidence: event.results[i][0].confidence,
          });
          
          if (isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        onChange(value + finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("[Speech Recognition] ❌ ERROR:", {
          error: event.error,
          message: event.message || "No message",
          type: event.type,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted,
        });
        
        // Stop listening on any error
        stopListening();
        
        // Clear any existing error timeout
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        
        // Handle specific error types
        switch (event.error) {
          case "no-speech":
            // No speech detected - silently stop (this is normal)
            console.log("[Speech Recognition] No speech detected (normal)");
            break;
          case "network":
            // Network error - check if it's due to HTTP protocol or connectivity issues
            const isLocalhostForNetwork = location.hostname === 'localhost' || 
              location.hostname === '127.0.0.1' || 
              location.hostname === '::1' ||
              location.hostname.startsWith('192.168.') ||
              location.hostname.startsWith('10.') ||
              location.hostname.startsWith('172.');
            
            const isHttpProtocol = location.protocol === 'http:';
            
            console.error("[Speech Recognition] Network error - detailed info:", {
              isOnline: navigator.onLine,
              connectionType: (navigator as any).connection?.effectiveType,
              downlink: (navigator as any).connection?.downlink,
              rtt: (navigator as any).connection?.rtt,
              protocol: location.protocol,
              hostname: location.hostname,
              isHttpProtocol,
              isLocalhostForNetwork,
              isSecureContext: window.isSecureContext,
            });
            
            // Web Speech API requires HTTPS for reliable operation
            // Even on localhost, HTTP may fail due to Chrome's security requirements
            // The service needs to connect to Google's speech recognition servers
            if (isHttpProtocol) {
              // HTTP protocol - Web Speech API typically requires HTTPS
              // On localhost, it may work in some browsers but often fails
              console.warn("[Speech Recognition] Network error on HTTP - Web Speech API requires HTTPS for reliable operation");
              setSpeechRecognitionAvailable(false);
              setErrorMessage("음성 인식은 HTTPS 환경에서만 사용할 수 있습니다. HTTPS로 접속해주세요.");
              errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 10000);
            } else {
              // HTTPS but still network error - could be:
              // 1. Temporary connectivity issue with Google's servers
              // 2. Firewall/proxy blocking the connection
              // 3. Service unavailable
              console.warn("[Speech Recognition] Network error on HTTPS - may be temporary connectivity issue");
              // Don't disable permanently on HTTPS - allow retry
              setErrorMessage("음성 인식 서비스 연결에 실패했습니다. 인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.");
              errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
            }
            break;
          case "not-allowed":
            // Microphone permission denied - disable to prevent repeated prompts
            console.error("[Speech Recognition] Permission denied");
            setSpeechRecognitionAvailable(false);
            setErrorMessage("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
            errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
            break;
          case "aborted":
            // Recognition aborted - silently stop
            console.log("[Speech Recognition] Recognition aborted");
            break;
          case "audio-capture":
            // No microphone found - disable to prevent repeated errors
            console.error("[Speech Recognition] No microphone found");
            setSpeechRecognitionAvailable(false);
            setErrorMessage("마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.");
            errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
            break;
          case "service-not-allowed":
            // Speech recognition service not allowed - disable
            console.error("[Speech Recognition] Service not allowed");
            setSpeechRecognitionAvailable(false);
            setErrorMessage("음성 인식 서비스가 허용되지 않았습니다.");
            errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
            break;
          default:
            // Other errors - disable if it's a persistent error
            console.error("[Speech Recognition] Unknown error:", event.error);
            if (event.error !== "aborted" && event.error !== "no-speech") {
              setSpeechRecognitionAvailable(false);
              setErrorMessage("음성 인식 중 오류가 발생했습니다.");
              errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
            }
            break;
        }
      };

      recognition.onend = () => {
        console.log("[Speech Recognition] Recognition ended");
        setIsListening(false);
        // Clean up microphone stream if still open
        if (microphoneStream) {
          microphoneStream.getTracks().forEach(track => track.stop());
          microphoneStream = null;
        }
      };

      console.log("[Speech Recognition] Starting recognition...");
      recognition.start();
      recognitionRef.current = recognition;
      console.log("[Speech Recognition] Recognition start() called");
    } catch (error: any) {
      console.error("[Speech Recognition] ❌ Exception during setup:", {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
      
      // Clean up microphone stream on error
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
      }
      
      setSpeechRecognitionAvailable(false);
      stopListening();
      setErrorMessage("음성 인식을 시작할 수 없습니다.");
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const stopListening = () => {
    console.log("[Speech Recognition] Stopping recognition...");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("[Speech Recognition] Recognition stopped");
      } catch (error) {
        console.warn("[Speech Recognition] Error stopping recognition:", error);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    console.log("[Speech Recognition] ===== STOPPED =====");
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
      "application/vnd.hancom.hwp",
      "application/x-hwp",
      "application/haansofthwp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isValidType =
      allowedTypes.includes(fileType) ||
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".hwp") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx");

    if (!isValidType) {
      alert("지원되는 파일 형식: PDF, JPG, PNG, HWP, DOC, DOCX");
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
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-200/20 dark:border-gray-700/20 bg-white dark:bg-[#1E293B] shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.hwp,.doc,.docx,application/pdf,image/jpeg,image/png,application/vnd.hancom.hwp,application/x-hwp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      {errorMessage && (
        <div className="px-4 py-2 mb-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg animate-in fade-in slide-in-from-top-1">
          {errorMessage}
        </div>
      )}
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
          disabled={disabled || !speechRecognitionAvailable}
          className={cn(
            "p-2 rounded-full transition-all shrink-0",
            isListening
              ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg shadow-blue-500/50 animate-pulse"
              : speechRecognitionAvailable
              ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-[#6D6D6D] dark:text-gray-400"
              : "opacity-30 cursor-not-allowed text-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isListening ? "음성 인식 중지" : speechRecognitionAvailable ? "음성 입력" : "음성 입력 사용 불가"}
          title={!speechRecognitionAvailable ? "음성 인식이 현재 사용할 수 없습니다" : undefined}
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

