"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

interface EditEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (email: string) => Promise<void>;
}

export function EditEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSave,
}: EditEmailModalProps) {
  const [email, setEmail] = React.useState(currentEmail);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setEmail(currentEmail);
      setError(null);
    }
  }, [isOpen, currentEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(email.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 변경에 실패했습니다.");
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
              이메일 변경
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-2">
                이메일
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

