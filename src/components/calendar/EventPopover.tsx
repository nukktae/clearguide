"use client";

import * as React from "react";
import { X, FileText, Calendar as CalendarIcon, ExternalLink, Edit, Trash2 } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { cn } from "@/src/lib/utils/cn";

interface EventPopoverProps {
  events: Array<{
    id: string;
    title: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentName: string;
    documentId: string;
    description?: string;
    type?: "custom" | "action" | "risk";
  }>;
  date: Date;
  onClose: () => void;
  onViewDetail: (documentId: string) => void;
  onEdit?: (event: EventPopoverProps["events"][0]) => void;
  onDelete?: (eventId: string) => Promise<void>;
  position?: { top: number; left: number };
  isMobile?: boolean;
}

export function EventPopover({
  events,
  date,
  onClose,
  onViewDetail,
  onEdit,
  onDelete,
  position,
  isMobile = false,
}: EventPopoverProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const urgencyLabels = {
    critical: "긴급",
    high: "높음",
    medium: "보통",
    low: "낮음",
    action: "일반",
  };

  const urgencyColors = {
    critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    high: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    low: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    action: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  const content = (
    <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
          {date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 일정
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
        </button>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#1A1A1A] dark:text-gray-100 flex-1">
                {event.title}
              </h4>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium ml-2 shrink-0",
                  urgencyColors[event.urgency]
                )}
              >
                {urgencyLabels[event.urgency]}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-2 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#6D6D6D] dark:text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{formatDate(event.deadline)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate max-w-[120px]">{event.documentName}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {event.documentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onViewDetail(event.documentId);
                onClose();
              }}
                  className="flex-1"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              상세 보기
            </Button>
              )}
              {event.type === "custom" && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="px-3"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {event.type === "custom" && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm("이 일정을 삭제하시겠습니까?")) {
                      setDeletingId(event.id);
                      try {
                        await onDelete(event.id);
                        onClose();
                      } catch (error) {
                        alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
                      } finally {
                        setDeletingId(null);
                      }
                    }
                  }}
                  disabled={deletingId === event.id}
                  className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#1E293B] rounded-t-2xl shadow-lg border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom duration-300">
          <div className="p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">
                {date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 일정
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-[#1A1A1A] dark:text-gray-100 flex-1">
                      {event.title}
                    </h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium ml-2 shrink-0",
                        urgencyColors[event.urgency]
                      )}
                    >
                      {urgencyLabels[event.urgency]}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#6D6D6D] dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formatDate(event.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{event.documentName}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.documentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onViewDetail(event.documentId);
                      onClose();
                    }}
                        className="flex-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    상세 보기
                  </Button>
                    )}
                    {event.type === "custom" && onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(event)}
                        className="px-3"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {event.type === "custom" && onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm("이 일정을 삭제하시겠습니까?")) {
                            setDeletingId(event.id);
                            try {
                              await onDelete(event.id);
                              onClose();
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
                            } finally {
                              setDeletingId(null);
                            }
                          }
                        }}
                        disabled={deletingId === event.id}
                        className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed z-50 animate-in fade-in duration-200"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {content}
    </div>
  );
}

