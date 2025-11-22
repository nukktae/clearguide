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
        "relative border-[1.5px] border-dashed rounded-[14px] h-[260px] text-center transition-all",
        "bg-white dark:bg-gray-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
        isDragging
          ? "border-[#2DB7A3] dark:border-teal-400 bg-[#2DB7A3]/5 dark:bg-teal-400/10"
          : "border-[#D4D7DD] dark:border-gray-600 hover:border-[#1A2A4F]/30 dark:hover:border-blue-400/50",
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
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <UploadCloud className="h-12 w-12 text-[#1A2B4A] dark:text-blue-400" strokeWidth={1.75} />
        <div className="flex flex-col items-center gap-3">
          <p className="text-base font-medium text-[#1A1A1A] dark:text-gray-100">
            파일을 여기로 끌어다 놓거나 클릭하여 업로드하세요
          </p>
          <p className="text-[13px] text-[#6D6D6D] dark:text-gray-400 opacity-60">
            PDF, JPG, PNG (최대 10MB)
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2A4F] text-white rounded-full font-medium hover:bg-[#2A3A5F] hover:shadow-md transition-all duration-200 mt-2"
          >
            <File className="h-4 w-4" strokeWidth={1.5} />
            파일 선택
          </button>
        </div>
      </div>
    </div>
  );
}

