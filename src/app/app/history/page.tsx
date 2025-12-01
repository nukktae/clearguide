"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Spinner } from "@/src/components/common/Spinner";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { DocumentSidebar, FilterType } from "@/src/components/storage/DocumentSidebar";
import { HeaderControls, ViewMode, SortOption } from "@/src/components/storage/HeaderControls";
import { DocumentTable } from "@/src/components/storage/DocumentTable";
import { DocumentGrid } from "@/src/components/storage/DocumentGrid";
import { EmptyState } from "@/src/components/storage/EmptyState";
import { getDeadlineStatus } from "@/src/lib/utils/calendar";

export default function HistoryPage() {
  const t = useTranslations();
  const [allDocuments, setAllDocuments] = React.useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [sortOption, setSortOption] = React.useState<SortOption>("date-desc");
  const router = useRouter();

  React.useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/app/api/documents");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "문서 목록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      const documents = data.documents || [];
      setAllDocuments(documents);
    } catch (err) {
      console.error("[History] Error loading documents:", err);
      setError(err instanceof Error ? err.message : "문서 목록을 불러오는데 실패했습니다.");
      setAllDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = [...allDocuments];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.fileName?.toLowerCase().includes(query) ||
          doc.parsed?.summary?.docType?.toLowerCase().includes(query) ||
          doc.parsed?.summary?.bullets?.some((bullet) =>
            bullet?.toLowerCase().includes(query)
          )
      );
    }

    // Apply category filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((doc) => {
        const docType = doc.parsed?.summary?.docType?.toLowerCase() || "";
        const fileType = doc.fileType?.toLowerCase() || "";

        switch (activeFilter) {
          case "tax":
            return (
              docType.includes("세금") ||
              docType.includes("tax") ||
              docType.includes("고지서")
            );
          case "community":
            return (
              docType.includes("주민센터") ||
              docType.includes("community") ||
              docType.includes("안내문")
            );
          case "penalty":
            return (
              docType.includes("과태료") ||
              docType.includes("벌금") ||
              docType.includes("penalty") ||
              docType.includes("fine")
            );
          case "starred":
            // TODO: Implement starred functionality
            return false;
          case "overdue":
            return doc.parsed?.actions.some((action) => {
              if (!action.deadline) return false;
              return getDeadlineStatus(action.deadline) === "overdue";
            }) || false;
          case "pdf":
            return fileType === "application/pdf" || fileType === "pdf";
          case "image":
            return (
              fileType.startsWith("image/") ||
              ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allDocuments, searchQuery, activeFilter]);

  // Sort documents
  const sortedDocuments = React.useMemo(() => {
    const sorted = [...filteredDocuments];

    switch (sortOption) {
      case "date-desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      case "date-asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
      case "name-asc":
        return sorted.sort((a, b) =>
          a.fileName.localeCompare(b.fileName, "ko")
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          b.fileName.localeCompare(a.fileName, "ko")
        );
      default:
        return sorted;
    }
  }, [filteredDocuments, sortOption]);

  // Calculate document counts for sidebar
  const documentCounts = React.useMemo(() => {
    const counts = {
      all: allDocuments.length,
      tax: 0,
      community: 0,
      penalty: 0,
      starred: 0,
      overdue: 0,
      pdf: 0,
      image: 0,
    };

    allDocuments.forEach((doc) => {
      const docType = doc.parsed?.summary?.docType?.toLowerCase() || "";
      const fileType = doc.fileType?.toLowerCase() || "";

      if (
        docType.includes("세금") ||
        docType.includes("tax") ||
        docType.includes("고지서")
      ) {
        counts.tax++;
      }
      if (
        docType.includes("주민센터") ||
        docType.includes("community") ||
        docType.includes("안내문")
      ) {
        counts.community++;
      }
      if (
        docType.includes("과태료") ||
        docType.includes("벌금") ||
        docType.includes("penalty") ||
        docType.includes("fine")
      ) {
        counts.penalty++;
      }
      if (
        doc.parsed?.actions.some((action) => {
          if (!action.deadline) return false;
          return getDeadlineStatus(action.deadline) === "overdue";
        })
      ) {
        counts.overdue++;
      }
      if (fileType === "application/pdf" || fileType === "pdf") {
        counts.pdf++;
      }
      if (
        fileType.startsWith("image/") ||
        ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)
      ) {
        counts.image++;
      }
    });

    return counts;
  }, [allDocuments]);

  const handleView = (id: string) => {
    router.push(`/app/document/${id}`);
  };

  const handleSummary = (id: string) => {
    router.push(`/app/document/${id}?tab=summary`);
  };

  const handleActionGuide = (id: string) => {
    router.push(`/app/document/${id}?tab=actions`);
  };

  const handleAddToCalendar = (id: string) => {
    router.push(`/app/calendar`);
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/app/api/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "파일 이름 변경에 실패했습니다.");
      }

      // Update local state
      setAllDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, fileName: newName } : doc
        )
      );
    } catch (err) {
      console.error("[History] Error renaming document:", err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[#6D6D6D] dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <DocumentSidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          documentCounts={documentCounts}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">
              {t("history.title")}
            </h1>
            <p className="text-[#6D6D6D] dark:text-gray-400">
              {t("history.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
              <p>{error}</p>
            </div>
          )}

          {/* Controls */}
          <HeaderControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />

          {/* Content */}
          {sortedDocuments.length === 0 ? (
            <EmptyState />
          ) : viewMode === "list" ? (
            <DocumentTable
              documents={sortedDocuments}
              onView={handleView}
              onSummary={handleSummary}
              onActionGuide={handleActionGuide}
              onAddToCalendar={handleAddToCalendar}
              onRename={handleRename}
            />
          ) : (
            <DocumentGrid documents={sortedDocuments} onView={handleView} />
          )}
        </div>
      </main>
    </div>
  );
}

