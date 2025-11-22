"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/src/components/common/Card";
import { Spinner } from "@/src/components/common/Spinner";
import { DocumentRecord } from "@/src/lib/parsing/types";
import { Calendar as CalendarIcon } from "lucide-react";
import { ViewSelector } from "@/src/components/calendar/ViewSelector";
import { CalendarContainer } from "@/src/components/calendar/CalendarContainer";
import { DeadlineListView } from "@/src/components/calendar/DeadlineListView";

interface DeadlineItem {
  id: string;
  title: string;
  deadline: string;
  type: "action" | "risk";
  documentId: string;
  documentName: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export default function CalendarPage() {
  const t = useTranslations();
  const [deadlines, setDeadlines] = React.useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<"calendar" | "list">("calendar");
  const router = useRouter();

  React.useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/app/api/documents");
      if (!response.ok) {
        throw new Error(t("calendar.loadError"));
      }
      const data = await response.json();
      const documents: DocumentRecord[] = data.documents || [];

      // Extract deadlines from all documents
      const allDeadlines: DeadlineItem[] = [];

      documents.forEach((doc) => {
        if (!doc.parsed) return;

        // Extract deadlines from actions
        doc.parsed.actions.forEach((action) => {
          if (action.deadline) {
            allDeadlines.push({
              id: `action-${doc.id}-${action.id}`,
              title: action.title,
              deadline: action.deadline,
              type: "action",
              documentId: doc.id,
              documentName: doc.fileName,
              description: action.description,
            });
          }
        });

        // Extract deadlines from risks
        doc.parsed.risks.forEach((risk) => {
          if (risk.deadline) {
            allDeadlines.push({
              id: `risk-${doc.id}-${risk.id}`,
              title: risk.title,
              deadline: risk.deadline,
              type: "risk",
              documentId: doc.id,
              documentName: doc.fileName,
              description: risk.message,
              severity: risk.severity,
            });
          }
        });
      });

      // Sort by deadline date (upcoming first)
      allDeadlines.sort((a, b) => {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        return dateA - dateB;
      });

      setDeadlines(allDeadlines);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("calendar.unknownError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Transform deadlines for calendar component
  const calendarEvents = React.useMemo(() => {
    return deadlines.map((deadline) => ({
      id: deadline.id,
      title: deadline.title,
      deadline: deadline.deadline,
      urgency:
        deadline.type === "risk" && deadline.severity
          ? deadline.severity
          : ("action" as const),
      documentName: deadline.documentName,
      documentId: deadline.documentId,
      description: deadline.description,
    }));
  }, [deadlines]);

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

  const handleViewDetail = (documentId: string) => {
    router.push(`/app/document/${documentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">
            {t("calendar.title")}
          </h1>
          <p className="text-[#6D6D6D] dark:text-gray-400">
            {t("calendar.subtitle")}
          </p>
        </div>
        {deadlines.length > 0 && (
          <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
          <p>{error}</p>
        </div>
      )}

      {deadlines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-[#6D6D6D] dark:text-gray-400 mx-auto mb-4" />
            <p className="text-[#6D6D6D] dark:text-gray-400 mb-2 font-medium">
              {t("calendar.emptyTitle")}
            </p>
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">
              {t("calendar.emptySubtitle")}
            </p>
          </CardContent>
        </Card>
      ) : currentView === "calendar" ? (
        <CalendarContainer
          events={calendarEvents}
          onViewDetail={handleViewDetail}
        />
      ) : (
        <DeadlineListView deadlines={deadlines} onItemClick={handleViewDetail} />
      )}
    </div>
  );
}

