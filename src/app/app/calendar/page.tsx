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
import { useAuth } from "@/src/contexts/AuthContext";
import { getIdToken } from "@/src/lib/firebase/auth";

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
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    // Wait for auth to finish loading before trying to fetch data
    if (!authLoading) {
      if (user) {
        loadDeadlines();
      } else {
        // User is not authenticated - redirect to login
        router.push("/login?redirect=/app/calendar");
      }
    }
  }, [authLoading, user]);

  const loadDeadlines = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token from Firebase Auth
      const token = await getIdToken();
      if (!token) {
        console.warn("[Calendar] No auth token available, redirecting to login");
        router.push("/login?redirect=/app/calendar");
        return;
      }

      // Include Authorization header
      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
      };

      // Load both document deadlines and custom calendar events
      const [documentsResponse, calendarResponse] = await Promise.all([
        fetch("/api/documents", { headers, credentials: "include" }),
        fetch("/api/calendar", { headers, credentials: "include" }),
      ]);

      let documents: DocumentRecord[] = [];
      let allDeadlines: DeadlineItem[] = [];

      // Process documents
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        documents = documentsData.documents || [];
      } else {
        // Handle authentication errors
        if (documentsResponse.status === 401) {
          router.push("/login?redirect=/app/calendar");
          return;
        }
        const errorData = await documentsResponse.json().catch(() => ({}));
        console.error("[Calendar] Failed to load documents:", errorData.error || "문서 목록을 불러오는데 실패했습니다.");
        // Continue without documents - we'll still show calendar events
      }

      // Helper function to validate if a deadline is a valid date string
      const isValidDateDeadline = (deadline: any): boolean => {
        if (!deadline) return false;
        if (typeof deadline !== "string") return false;
        // Check if it's a valid YYYY-MM-DD format or can be parsed as a date
        const dateStr = deadline.split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const date = new Date(dateStr + "T00:00:00");
          return !isNaN(date.getTime());
        }
        // Try parsing as date
        const date = new Date(deadline);
        return !isNaN(date.getTime()) && dateStr.length >= 10; // Must be at least YYYY-MM-DD length
      };

      // Extract deadlines from documents
      documents.forEach((doc) => {
        if (!doc.parsed) return;

        // Extract deadlines from actions
        doc.parsed.actions.forEach((action) => {
          if (action.deadline && isValidDateDeadline(action.deadline)) {
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
          if (risk.deadline && isValidDateDeadline(risk.deadline)) {
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

      // Add custom calendar events
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.success && calendarData.events) {
          calendarData.events.forEach((event: any) => {
            // Only add events with valid date deadlines
            if (event.deadline && isValidDateDeadline(event.deadline)) {
              allDeadlines.push({
                id: `custom-${event.id}`,
                title: event.title,
                deadline: event.deadline,
                type: event.type === "risk" ? "risk" : "action",
                documentId: event.documentId || "",
                documentName: event.documentName || "사용자 일정",
                description: event.description,
                severity: event.severity || (event.urgency === "critical" ? "critical" : event.urgency === "high" ? "high" : event.urgency === "medium" ? "medium" : "low"),
              });
            }
          });
        }
      } else {
        // Handle authentication errors
        if (calendarResponse.status === 401) {
          router.push("/login?redirect=/app/calendar");
          return;
        }
        const errorData = await calendarResponse.json().catch(() => ({}));
        console.error("[Calendar] Failed to load calendar events:", errorData.error || "캘린더 이벤트를 불러오는데 실패했습니다.");
        // Continue without calendar events - we'll still show document deadlines
      }

      // Sort by deadline date (upcoming first)
      // Normalize deadlines before sorting to handle Firestore Timestamps
      allDeadlines.forEach((deadline) => {
        const deadlineValue = deadline.deadline as any;
        if (deadlineValue && typeof deadlineValue === "object") {
          // Handle Firestore Timestamp objects
          if (deadlineValue._seconds !== undefined) {
            const date = new Date(deadlineValue._seconds * 1000 + (deadlineValue._nanoseconds || 0) / 1000000);
            deadline.deadline = date.toISOString().split("T")[0];
          } else if (typeof deadlineValue.toDate === "function") {
            deadline.deadline = deadlineValue.toDate().toISOString().split("T")[0];
          }
        }
      });
      
      allDeadlines.sort((a, b) => {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        // Handle invalid dates
        if (isNaN(dateA) || isNaN(dateB)) {
          return isNaN(dateA) ? 1 : -1; // Invalid dates go to end
        }
        return dateA - dateB;
      });

      setDeadlines(allDeadlines);
    } catch (err) {
      console.error("[Calendar] Error loading deadlines:", err);
      setError(err instanceof Error ? err.message : "일정을 불러오는데 실패했습니다.");
      setDeadlines([]);
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
      type: deadline.id.startsWith("custom-") ? ("custom" as const) : deadline.type,
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

  const handleEventChange = () => {
    // Reload deadlines when events are created/updated/deleted
    loadDeadlines();
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
        <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
          <p>{error}</p>
        </div>
      )}

      {currentView === "calendar" ? (
        <CalendarContainer
          events={calendarEvents}
          onViewDetail={handleViewDetail}
          onEventCreate={handleEventChange}
          onEventUpdate={handleEventChange}
          onEventDelete={handleEventChange}
        />
      ) : deadlines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CalendarIcon className="h-8 w-8 text-[#6D6D6D] dark:text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">
              등록된 일정이 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <DeadlineListView deadlines={deadlines} onItemClick={handleViewDetail} />
      )}
    </div>
  );
}

