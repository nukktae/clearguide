"use client";

import * as React from "react";
import { FileText, Image as ImageIcon, FileCode, Download } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { ParsedDocument, DocumentRecord } from "@/src/lib/parsing/types";
import { PDFViewer } from "./PDFViewer";

interface TabbedDocumentViewerProps {
  document: DocumentRecord;
  parsedDocument?: ParsedDocument;
  className?: string;
}

// Helper to detect file types
function isHWPFileType(fileType: string | undefined, fileName: string | undefined): boolean {
  const hwpMimeTypes = [
    "application/vnd.hancom.hwp",
    "application/x-hwp",
    "application/haansofthwp",
  ];
  return hwpMimeTypes.includes(fileType || "") || 
         (fileName?.toLowerCase().endsWith(".hwp") ?? false);
}

function isWordFileType(fileType: string | undefined, fileName: string | undefined): boolean {
  const wordMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const lowerFileName = fileName?.toLowerCase() ?? "";
  return wordMimeTypes.includes(fileType || "") || 
         lowerFileName.endsWith(".docx") || 
         (lowerFileName.endsWith(".doc") && !lowerFileName.endsWith(".docx"));
}

export function TabbedDocumentViewer({
  document,
  parsedDocument,
  className,
}: TabbedDocumentViewerProps) {
  const [activeTab, setActiveTab] = React.useState<"preview" | "text">("preview");
  const [ocrText, setOcrText] = React.useState<string | null>(null);
  const [isLoadingOcr, setIsLoadingOcr] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  
  const isPDF = document.fileType === "application/pdf";
  const isImage = document.fileType?.startsWith("image/") ?? false;
  const isHWP = isHWPFileType(document.fileType, document.fileName);
  const isWord = isWordFileType(document.fileType, document.fileName);
  
  // Construct file URL - try filePath first, then fallback to document ID + extension
  const getFileUrl = (): string | undefined => {
    if (document.filePath) {
      return `/app/api/files/${document.filePath}`;
    }
    // Fallback: try to construct from document ID and file type
    if (document.id && document.fileType) {
      let extension = '';
      if (isPDF) {
        extension = '.pdf';
      } else if (document.fileType.includes('jpeg') || document.fileType.includes('jpg')) {
        extension = '.jpg';
      } else if (document.fileType.includes('png')) {
        extension = '.png';
      } else if (isHWP) {
        extension = '.hwp';
      } else if (document.fileType.includes('wordprocessingml')) {
        extension = '.docx';
      } else if (document.fileType === 'application/msword') {
        extension = '.doc';
      }
      if (extension) {
        return `/app/api/files/${document.id}${extension}`;
      }
    }
    return undefined;
  };
  
  const fileUrl = getFileUrl();

  // Debug logging
  React.useEffect(() => {
    console.log("[TabbedDocumentViewer] Document props:", {
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.filePath,
      hasFileUrl: !!fileUrl,
      fileUrl,
    });
  }, [document.id, document.filePath, fileUrl]);

  // Reset image error when fileUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [fileUrl]);

  // Fetch OCR text when text tab is active
  React.useEffect(() => {
    if (activeTab === "text" && !ocrText && !isLoadingOcr && document.id) {
      setIsLoadingOcr(true);
      console.log("[TabbedDocumentViewer] Fetching OCR text for document:", document.id);
      
      // Get auth token and fetch OCR
      (async () => {
        try {
          const { getIdToken } = await import("@/src/lib/firebase/auth");
          const token = await getIdToken();
          if (!token) {
            throw new Error("로그인이 필요합니다.");
          }

          const headers: HeadersInit = {
            "Authorization": `Bearer ${token}`,
          };

          fetch(`/app/api/ocr?documentId=${document.id}`, {
            headers,
            credentials: "include",
          })
            .then(res => res.json())
            .then(data => {
              console.log("[TabbedDocumentViewer] OCR fetch response:", {
                success: data.success,
                hasOcrResult: !!data.ocrResult,
                textLength: data.ocrResult?.text?.length || 0,
              });
              
              if (data.success && data.ocrResult?.text) {
                setOcrText(data.ocrResult.text);
              } else {
                // Fallback: try using document.rawText if available
                if (document.rawText) {
                  setOcrText(document.rawText);
                } else {
                  setOcrText(null);
                }
              }
            })
            .catch(err => {
              console.error("[TabbedDocumentViewer] Error fetching OCR:", err);
              // Fallback to document.rawText if available
              if (document.rawText) {
                setOcrText(document.rawText);
              } else {
                setOcrText(null);
              }
            })
            .finally(() => {
              setIsLoadingOcr(false);
            });
        } catch (err) {
          console.error("[TabbedDocumentViewer] Error getting auth token:", err);
          setIsLoadingOcr(false);
          // Fallback to document.rawText if available
          if (document.rawText) {
            setOcrText(document.rawText);
          }
        }
      })();
    }
  }, [activeTab, document.id, document.rawText, ocrText, isLoadingOcr]);

  return (
    <div
      className={cn(
        "bg-white border border-[#ECEEF3] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] overflow-hidden max-w-[620px]",
        className
      )}
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTab("preview")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium transition-colors relative",
            activeTab === "preview"
              ? "text-[#1A1A1A]"
              : "text-[#6D6D6D] hover:text-[#1A1A1A]"
          )}
        >
          {isPDF ? "PDF 보기" : isImage ? "이미지 보기" : isHWP ? "HWP 문서" : isWord ? "Word 문서" : "문서 보기"}
          {activeTab === "preview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C2329]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium transition-colors relative",
            activeTab === "text"
              ? "text-[#1A1A1A]"
              : "text-[#6D6D6D] hover:text-[#1A1A1A]"
          )}
        >
          텍스트 보기
          {activeTab === "text" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C2329]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative bg-gray-50 h-[800px] overflow-y-auto">
        {activeTab === "preview" ? (
          <div className="flex items-center justify-center p-4 h-full">
            {fileUrl ? (
              <>
                {isPDF ? (
                  <PDFViewer
                    fileUrl={fileUrl}
                    fileName={document.fileName}
                    parsedDocument={parsedDocument}
                    className="w-full h-full"
                  />
                ) : isImage ? (
                  imageError ? (
                    <div className="text-center p-8">
                      <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-2">이미지를 불러올 수 없습니다</p>
                      <p className="text-xs text-gray-400">파일 경로: {document.filePath || "없음"}</p>
                    </div>
                  ) : (
                  <img
                    src={fileUrl}
                    alt={document.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                      onError={() => {
                        console.error("[TabbedDocumentViewer] Image load error:", fileUrl);
                        setImageError(true);
                      }}
                      onLoad={() => {
                        console.log("[TabbedDocumentViewer] Image loaded successfully:", fileUrl);
                        setImageError(false);
                      }}
                  />
                  )
                ) : isHWP ? (
                  <div className="text-center p-8">
                    <FileCode className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">HWP 문서</p>
                    <p className="text-sm text-gray-500 mb-4">
                      한글(HWP) 파일은 브라우저에서 직접 미리보기가 지원되지 않습니다.
                    </p>
                    <button
                      onClick={() => setActiveTab("text")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      추출된 텍스트 보기
                    </button>
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        download={document.fileName}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors ml-2"
                      >
                        <Download className="h-4 w-4" />
                        파일 다운로드
                      </a>
                    )}
                  </div>
                ) : isWord ? (
                  <div className="text-center p-8">
                    <FileCode className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Word 문서</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Word 파일은 브라우저에서 직접 미리보기가 지원되지 않습니다.
                    </p>
                    <button
                      onClick={() => setActiveTab("text")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      추출된 텍스트 보기
                    </button>
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        download={document.fileName}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors ml-2"
                      >
                        <Download className="h-4 w-4" />
                        파일 다운로드
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">미리보기를 사용할 수 없습니다</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8">
                {isPDF ? (
                  <>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">PDF 문서</p>
                    <p className="text-xs text-gray-400">원본 파일은 저장되지 않았습니다</p>
                    {document.filePath && (
                      <p className="text-xs text-gray-400 mt-1">파일 경로: {document.filePath}</p>
                    )}
                  </>
                ) : isImage ? (
                  <>
                    <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">이미지 파일</p>
                    <p className="text-xs text-gray-400">원본 파일은 저장되지 않았습니다</p>
                    {document.filePath && (
                      <p className="text-xs text-gray-400 mt-1">파일 경로: {document.filePath}</p>
                    )}
                  </>
                ) : (
                  <>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">문서 미리보기</p>
                    {document.filePath ? (
                      <p className="text-xs text-gray-400 mt-1">파일 경로: {document.filePath}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">파일 경로가 없습니다</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 h-full">
            <div className="mb-3 flex items-center justify-between">
              {ocrText ? (
                <span className="text-[13px] px-2 py-1 bg-green-100 text-green-700 rounded-md">
                  OCR 적용됨
                </span>
              ) : isLoadingOcr ? (
                <span className="text-[13px] px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                  OCR 로딩 중...
                </span>
              ) : (
                <span className="text-[13px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  OCR 미적용
                </span>
              )}
            </div>
            {isLoadingOcr ? (
              <div className="bg-white rounded-lg p-6 text-center h-[calc(100%-60px)] flex flex-col items-center justify-center border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DB7A3] mb-2"></div>
                <p className="text-[14px] text-gray-500">OCR 텍스트를 불러오는 중...</p>
              </div>
            ) : ocrText ? (
              <div className="bg-white rounded-lg p-4 h-[calc(100%-60px)] overflow-y-auto border border-gray-100">
                <pre className="text-[14px] text-[#4E535A] whitespace-pre-wrap font-sans leading-relaxed">
                  {ocrText}
                </pre>
              </div>
            ) : document.rawText ? (
              <div className="bg-white rounded-lg p-4 h-[calc(100%-60px)] overflow-y-auto border border-gray-100">
                <pre className="text-[14px] text-[#4E535A] whitespace-pre-wrap font-sans leading-relaxed">
                  {document.rawText}
                </pre>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center h-[calc(100%-60px)] flex flex-col items-center justify-center border border-gray-100">
                <FileText className="h-8 w-8 text-gray-300 mb-2" strokeWidth={1.5} />
                <p className="text-[14px] text-gray-500">텍스트 추출 데이터가 없습니다</p>
                <p className="text-[12px] text-gray-400 mt-1">OCR을 실행하여 텍스트를 추출하세요</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

