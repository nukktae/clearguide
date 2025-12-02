"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { cn } from "@/src/lib/utils/cn";

interface CalendarEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: {
    title: string;
    description?: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentId?: string;
    documentName?: string;
    type?: "custom" | "action" | "risk";
    severity?: "low" | "medium" | "high" | "critical";
  }) => Promise<void>;
  initialDate?: Date;
  initialEvent?: {
    id: string;
    title: string;
    description?: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentId?: string;
    documentName?: string;
    type?: "custom" | "action" | "risk";
    severity?: "low" | "medium" | "high" | "critical";
  };
}

export function CalendarEventForm({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialEvent,
}: CalendarEventFormProps) {
  const [title, setTitle] = React.useState(initialEvent?.title || "");
  const [description, setDescription] = React.useState(initialEvent?.description || "");
  const [deadline, setDeadline] = React.useState(
    initialEvent?.deadline || 
    (initialDate ? initialDate.toISOString().split("T")[0] : "")
  );
  const [urgency, setUrgency] = React.useState<"critical" | "high" | "medium" | "low" | "action">(
    initialEvent?.urgency || "action"
  );
  const [severity, setSeverity] = React.useState<"low" | "medium" | "high" | "critical" | undefined>(
    initialEvent?.severity
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        setTitle(initialEvent.title);
        setDescription(initialEvent.description || "");
        setDeadline(initialEvent.deadline);
        setUrgency(initialEvent.urgency);
        setSeverity(initialEvent.severity);
      } else {
        setTitle("");
        setDescription("");
        setDeadline(initialDate ? initialDate.toISOString().split("T")[0] : "");
        setUrgency("action");
        setSeverity(undefined);
      }
      setError(null);
    }
  }, [isOpen, initialEvent, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!deadline) {
      setError("마감일을 선택해주세요.");
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(deadline)) {
      setError("올바른 날짜 형식을 입력해주세요. (YYYY-MM-DD)");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline,
        urgency,
        documentId: initialEvent?.documentId,
        documentName: initialEvent?.documentName,
        type: initialEvent?.type || "custom",
        severity: severity || (urgency === "critical" ? "critical" : urgency === "high" ? "high" : urgency === "medium" ? "medium" : "low"),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이벤트 저장 중 오류가 발생했습니다.");
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
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
              {initialEvent ? "일정 수정" : "새 일정 추가"}
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
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-1.5">
                제목 *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-1.5">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="일정에 대한 설명을 입력하세요 (선택사항)"
                rows={3}
                className={cn(
                  "w-full rounded-[10px] border border-[#E5E8EB] dark:border-gray-700",
                  "bg-white dark:bg-gray-800 px-4 py-2 text-base sm:text-sm min-h-[44px]",
                  "text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#9CA3AF]",
                  "focus:outline-none focus:ring-2 focus:ring-[#1C3D6E]/20 focus:border-[#1C3D6E]",
                  "transition-colors resize-none"
                )}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-1.5">
                마감일 *
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-1.5">
                긴급도 *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className={cn(
                  "w-full h-[50px] min-h-[44px] rounded-[10px] border border-[#E5E8EB] dark:border-gray-700",
                  "bg-white dark:bg-gray-800 px-4 text-base sm:text-sm",
                  "text-[#1A1A1A] dark:text-gray-100",
                  "focus:outline-none focus:ring-2 focus:ring-[#1C3D6E]/20 focus:border-[#1C3D6E]",
                  "transition-colors"
                )}
                disabled={isSubmitting}
              >
                <option value="action">일반</option>
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="critical">긴급</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "저장 중..." : initialEvent ? "수정" : "추가"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

