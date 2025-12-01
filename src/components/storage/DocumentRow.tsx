"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Calendar,
  MoreVertical,
  Eye,
  FileCheck,
  AlertCircle,
  CalendarPlus,
  ExternalLink,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { cn } from "@/src/lib/utils/cn";
import { formatDeadlineWithDays, getDeadlineStatus } from "@/src/lib/utils/calendar";

interface DocumentRowProps {
  document: DocumentRecord;
  onView: (id: string) => void;
  onSummary?: (id: string) => void;
  onActionGuide?: (id: string) => void;
  onAddToCalendar?: (id: string) => void;
  onRename?: (id: string, newName: string) => Promise<void>;
}

export function DocumentRow({
  document,
  onView,
  onSummary,
  onActionGuide,
  onAddToCalendar,
  onRename,
}: DocumentRowProps) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(document.fileName || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(document.fileName || "");
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(document.fileName || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRename || !editedName.trim()) return;
    
    setIsSaving(true);
    try {
      await onRename(document.id, editedName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to rename:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(e as unknown as React.MouseEvent);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditedName(document.fileName || "");
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = typeof window !== "undefined" ? window.document.documentElement.lang || "ko" : "ko";
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\./g, "/").replace(/\s/g, "");
  };

  const docType = document.parsed?.summary.docType || t("common.document");
  const hasRisks = (document.parsed?.risks.length || 0) > 0;
  const riskCount = document.parsed?.risks.length || 0;
  const hasActions = (document.parsed?.actions.length || 0) > 0;
  const actionCount = document.parsed?.actions.length || 0;

  // Check for overdue deadlines
  const hasOverdue = document.parsed?.actions.some((action) => {
    if (!action.deadline) return false;
    const status = getDeadlineStatus(action.deadline);
    return status === "overdue";
  });

  // Get file type
  const fileType = document.fileType?.toLowerCase() || "";
  const isPDF = fileType === "application/pdf" || fileType === "pdf";
  const isImage =
    fileType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType);

  // Get analysis status
  const confidence = document.parsed?.meta.confidence || 0;
  const analysisStatus = confidence > 0 ? `${Math.round(confidence)}%` : t("documentTable.completed");

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "grid grid-cols-[minmax(200px,1fr)_minmax(80px,auto)_minmax(80px,auto)] md:grid-cols-[minmax(200px,1fr)_minmax(150px,auto)_minmax(120px,auto)_minmax(80px,auto)_minmax(100px,auto)_minmax(160px,auto)] gap-3 md:gap-4 items-center py-3 px-4 rounded-lg transition-colors cursor-pointer",
          isHovered && "bg-gray-50 dark:bg-gray-800/50"
        )}
        onClick={() => onView(document.id)}
      >
        {/* Icon + Name */}
        <div className="flex items-center gap-3 min-w-0 h-5">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center">
            <div className="rounded bg-[#F4F6F9] dark:bg-gray-800 p-1.5 flex items-center justify-center w-8 h-8">
              <FileText className="h-4 w-4 text-[#1C2329] dark:text-blue-400" strokeWidth={2} />
            </div>
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-0 px-2 py-0.5 text-sm font-medium text-[#1A1A1A] dark:text-gray-100 bg-white dark:bg-gray-700 border border-[#2DB7A3] rounded focus:outline-none focus:ring-1 focus:ring-[#2DB7A3]"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedName.trim()}
                  className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                  title="저장"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  title="취소"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ) : (
              <>
            <div className="font-medium text-[#1A1A1A] dark:text-gray-100 truncate text-sm leading-5 h-5 flex items-center">
                  {document.fileName || "이름 없음"}
            </div>
                {onRename && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="이름 변경"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#6D6D6D]" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Document Type */}
        <div className="hidden md:flex items-center text-sm text-[#6D6D6D] dark:text-gray-400 min-w-0 h-5">
          <span className="truncate leading-5 h-5 flex items-center">{docType}</span>
        </div>

        {/* Upload Date */}
        <div className="hidden md:flex items-center gap-1.5 text-sm text-[#6D6D6D] dark:text-gray-400 whitespace-nowrap h-5">
          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="leading-5 h-5 flex items-center">{formatDate(document.uploadedAt)}</span>
        </div>

        {/* Analysis Status */}
        <div className="flex items-center justify-center text-xs text-[#6D6D6D] dark:text-gray-400 whitespace-nowrap leading-5 h-5">
          {analysisStatus}
        </div>

        {/* Warnings */}
        <div className="flex items-center gap-2 min-w-0 h-5">
          {hasOverdue && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded whitespace-nowrap leading-5 h-5 flex items-center">
              {t("documentTable.overdue")}
            </span>
          )}
          {hasRisks && !hasOverdue && (
            <div className="flex items-center gap-1.5 leading-5 h-5">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-xs text-[#6D6D6D] dark:text-gray-400 whitespace-nowrap h-5 flex items-center">
                {riskCount}{t("documentTable.items")}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions - Desktop only */}
        <div
          className="hidden md:flex items-center gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(document.id);
              }}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={t("documentTable.view")}
            >
              <Eye className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
            </button>
            {onSummary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSummary(document.id);
                }}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t("documentTable.summary")}
              >
                <FileCheck className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
              </button>
            )}
            {onActionGuide && hasActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionGuide(document.id);
                }}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t("documentTable.actionGuide")}
              >
                <AlertCircle className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
              </button>
            )}
            {onAddToCalendar && hasActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCalendar(document.id);
                }}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t("documentTable.addToCalendar")}
              >
                <CalendarPlus className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

