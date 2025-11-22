"use client";

import { UploadDropzone } from "./UploadDropzone";
import { FilePreviewBar } from "./FilePreviewBar";
import { useTranslations } from "next-intl";

export interface UploadCardProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  progress?: number;
}

export function UploadCard({
  file,
  onFileSelect,
  onFileRemove,
  progress,
}: UploadCardProps) {
  const t = useTranslations("upload");

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#ECEEF3] dark:border-gray-700 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] p-16 lg:p-20">
      {!file ? (
        <UploadDropzone onFileSelect={onFileSelect} />
      ) : (
        <FilePreviewBar
          fileName={file.name}
          fileSize={file.size}
          onRemove={onFileRemove}
          progress={progress}
        />
      )}
    </div>
  );
}

