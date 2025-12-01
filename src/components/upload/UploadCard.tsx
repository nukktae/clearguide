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
    <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-12 lg:p-16">
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

