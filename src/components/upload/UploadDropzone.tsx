"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/utils/cn";
import { UploadCloud, File } from "lucide-react";

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  acceptedTypes = "application/pdf,image/jpeg,image/jpg,image/png",
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const t = useTranslations("common");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`파일 크기는 ${maxSize / 1024 / 1024}MB를 초과할 수 없습니다.`);
      return;
    }

    const allowedTypes = acceptedTypes.split(",").map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      alert("지원하지 않는 파일 형식입니다. PDF, JPG, PNG만 지원됩니다.");
      return;
    }

    onFileSelect(file);
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-3xl h-[320px] text-center transition-all duration-300",
        "bg-[#FAFAFA] dark:bg-[#1E293B]",
        isDragging
          ? "border-[#2DB7A3] dark:border-[#2DB7A3] bg-[#2DB7A3]/5 dark:bg-[#2DB7A3]/10 scale-[1.02]"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
        <div className="w-16 h-16 rounded-full bg-[#F5F5F7] dark:bg-[#2A3441] flex items-center justify-center">
          <UploadCloud className="h-8 w-8 text-[#6D6D6D] dark:text-gray-400" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-medium text-[#1C2329] dark:text-gray-100 tracking-tight">
            파일을 여기로 끌어다 놓거나 클릭하여 업로드하세요
          </p>
          <p className="text-sm text-[#6D6D6D] dark:text-gray-400 font-light">
            PDF, JPG, PNG (최대 10MB)
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C2329] dark:bg-white text-white dark:text-[#1C2329] rounded-full text-sm font-medium hover:bg-[#2A3441] dark:hover:bg-gray-100 transition-all duration-200 mt-4 shadow-sm hover:shadow-md"
          >
            <File className="h-4 w-4" strokeWidth={1.5} />
            파일 선택
          </button>
        </div>
      </div>
    </div>
  );
}

