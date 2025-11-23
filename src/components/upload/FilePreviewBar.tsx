"use client";

import * as React from "react";
import { File, X } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { Button } from "@/src/components/common/Button";

export interface FilePreviewBarProps {
  fileName: string;
  fileSize: number;
  onRemove?: () => void;
  progress?: number;
  className?: string;
}

export function FilePreviewBar({
  fileName,
  fileSize,
  onRemove,
  progress,
  className,
}: FilePreviewBarProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#ECEEF3] dark:border-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      <div className="shrink-0">
        <div className="rounded bg-[#F4F6F9] dark:bg-gray-800 p-1.5">
          <File className="h-4 w-4 text-[#1C2329] dark:text-blue-400" strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-normal text-[#1A1A1A] dark:text-gray-100 truncate">
          {fileName}
        </p>
        <p className="text-[13px] text-[#6D6D6D] dark:text-gray-400">{formatFileSize(fileSize)}</p>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

