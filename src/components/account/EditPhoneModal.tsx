"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

interface EditPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onSave: (phone: string) => Promise<void>;
}

export function EditPhoneModal({
  isOpen,
  onClose,
  currentPhone,
  onSave,
}: EditPhoneModalProps) {
  const [phone, setPhone] = React.useState(currentPhone);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone);
      setError(null);
    }
  }, [isOpen, currentPhone]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length < 10) {
      setError("올바른 전화번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(phone);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "전화번호 변경에 실패했습니다.");
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md my-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
              {currentPhone ? "전화번호 변경" : "전화번호 추가"}
            </h3>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
              aria-label="닫기"
            >
              <X className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
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
                전화번호
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
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

