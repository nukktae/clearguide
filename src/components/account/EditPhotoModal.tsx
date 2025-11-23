"use client";

import * as React from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import Image from "next/image";

interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function EditPhotoModal({
  isOpen,
  onClose,
  currentPhotoUrl,
  onUpload,
  onDelete,
}: EditPhotoModalProps) {
  const [preview, setPreview] = React.useState<string | null>(currentPhotoUrl);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPreview(currentPhotoUrl);
      setError(null);
    }
  }, [isOpen, currentPhotoUrl]);

  const compressImage = (file: File, maxWidth: number = 300, maxHeight: number = 300, initialQuality: number = 0.5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const tryCompress = (quality: number): void => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                // Check if base64 data URL would be under 2000 characters
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  
                  // Firebase Auth limit is ~2048 characters, we target 1900 for safety
                  if (dataUrl.length > 1900 && quality > 0.2) {
                    // Try again with lower quality
                    tryCompress(Math.max(0.2, quality - 0.1));
                  } else {
                    const compressedFile = new File([blob], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  }
                };
                reader.onerror = () => reject(new Error("Failed to read compressed image"));
                reader.readAsDataURL(blob);
              },
              "image/jpeg",
              quality
            );
          };

          tryCompress(initialQuality);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    try {
      // Compress image before preview (400x400 max, 60% quality)
      const compressedFile = await compressImage(file);
      
      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      // Store compressed file for upload
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        fileInputRef.current.files = dataTransfer.files;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("프로필 사진을 삭제하시겠습니까?")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onDelete();
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
              프로필 사진 변경
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-[#F4F6F9] dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {preview ? (
                  <Image
                    src={preview}
                    alt="프로필 사진 미리보기"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl font-semibold text-[#6D6D6D] dark:text-gray-400">
                    ?
                  </span>
                )}
              </div>
            </div>

            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                사진 선택
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {currentPhotoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              )}
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isSubmitting || !fileInputRef.current?.files?.[0]}
                className="flex-1"
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

