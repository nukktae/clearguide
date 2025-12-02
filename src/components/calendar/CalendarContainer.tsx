"use client";

import * as React from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { EventPopover } from "./EventPopover";
import { UpcomingSidebar } from "./UpcomingSidebar";
import { CalendarEventForm } from "./CalendarEventForm";
import { deadlineToString } from "@/src/lib/utils/calendar";
import { getIdToken } from "@/src/lib/firebase/auth";

/**
 * Normalize deadline to date string (YYYY-MM-DD), handling Firestore Timestamps
 * Uses local timezone to match CalendarGrid and CalendarDay dateKey format
 */
function normalizeDeadlineToDateString(deadline: any): string | null {
  if (!deadline) return null;
  
  // Helper to format date in local timezone (YYYY-MM-DD)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  // Already a string in YYYY-MM-DD format
  if (typeof deadline === "string") {
    // Extract YYYY-MM-DD part (in case it includes time)
    const dateStr = deadline.split("T")[0];
    // Validate it's in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr; // Return as-is to avoid timezone conversion issues
    }
    // If not in YYYY-MM-DD format, try parsing it
    const date = new Date(deadline);
    if (!isNaN(date.getTime())) {
      return formatLocalDate(date);
    }
  }
  
  // Handle Firestore Timestamp objects (client SDK or Admin SDK)
  if (deadline && typeof deadline === "object") {
    // Client SDK Timestamp
    if (typeof deadline.toDate === "function") {
      const date = deadline.toDate();
      if (!isNaN(date.getTime())) {
        return formatLocalDate(date);
      }
    }
    // Admin SDK Timestamp or plain object with _seconds (from JSON serialization)
    if (deadline._seconds !== undefined) {
      const date = new Date(deadline._seconds * 1000 + (deadline._nanoseconds || 0) / 1000000);
      if (!isNaN(date.getTime())) {
        return formatLocalDate(date);
      }
    }
    // Already a Date
    if (deadline instanceof Date) {
      if (!isNaN(deadline.getTime())) {
        return formatLocalDate(deadline);
      }
    }
  }
  
  // Use the utility function as fallback
  try {
    const dateStr = deadlineToString(deadline);
    if (dateStr) {
      // Convert to local timezone format
      const date = new Date(dateStr + "T00:00:00");
      if (!isNaN(date.getTime())) {
        return formatLocalDate(date);
      }
    }
    return null;
  } catch {
    return null;
  }
}

interface CalendarContainerProps {
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
  onViewDetail: (documentId: string) => void;
  onEventCreate?: () => void;
  onEventUpdate?: () => void;
  onEventDelete?: () => void;
}

export function CalendarContainer({
  events,
  onViewDetail,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
}: CalendarContainerProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [popoverPosition, setPopoverPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formInitialDate, setFormInitialDate] = React.useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = React.useState<typeof events[0] | null>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((event) => {
      const dateKey = normalizeDeadlineToDateString(event.deadline);
      if (!dateKey) {
        // Skip events with invalid deadlines (null, relative text like "14일 이내", etc.)
        // These should have been filtered out earlier, but we check here as a safety measure
        return;
      }
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const handleDayClick = React.useCallback((date: Date, event: React.MouseEvent<HTMLButtonElement>) => {
    // Use local timezone to match CalendarGrid's dateKey format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const dayEvents = eventsByDate.get(dateKey) || [];

    // Double click to add event
    if (event.detail === 2 && dayEvents.length === 0) {
      setFormInitialDate(date);
      setEditingEvent(null);
      setIsFormOpen(true);
      return;
    }

    if (dayEvents.length === 0) return;

    setSelectedDate(date);

    if (isMobile) {
      setPopoverPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const popoverWidth = 320;
      const left = Math.min(
        rect.left,
        window.innerWidth - popoverWidth - 16
      );
      setPopoverPosition({
        top: rect.bottom + 8,
        left: Math.max(16, left),
      });
    }
  }, [eventsByDate, isMobile]);

  const handleCreateEvent = async (eventData: {
    title: string;
    description?: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentId?: string;
    documentName?: string;
    type?: "custom" | "action" | "risk";
    severity?: "low" | "medium" | "high" | "critical";
  }) => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers,
        body: JSON.stringify(eventData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "이벤트 생성에 실패했습니다.");
      }

      if (onEventCreate) {
        onEventCreate();
      }
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateEvent = async (eventData: {
    title: string;
    description?: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentId?: string;
    documentName?: string;
    type?: "custom" | "action" | "risk";
    severity?: "low" | "medium" | "high" | "critical";
  }) => {
    if (!editingEvent) return;

    try {
      // Extract event ID (format: custom-{id} or action-{docId}-{actionId})
      const eventId = editingEvent.id.startsWith("custom-")
        ? editingEvent.id.replace("custom-", "")
        : null;

      if (!eventId) {
        throw new Error("이 이벤트는 수정할 수 없습니다.");
      }

      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`/api/calendar/${eventId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(eventData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "이벤트 수정에 실패했습니다.");
      }

      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Extract event ID (format: custom-{id})
    const id = eventId.startsWith("custom-") ? eventId.replace("custom-", "") : null;

    if (!id) {
      throw new Error("이 이벤트는 삭제할 수 없습니다.");
    }

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(`/api/calendar/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "이벤트 삭제에 실패했습니다.");
      }

      if (onEventDelete) {
        onEventDelete();
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const selectedDateEvents =
    selectedDate && eventsByDate.get(selectedDate.toISOString().split("T")[0])
      ? eventsByDate.get(selectedDate.toISOString().split("T")[0])!
      : [];

  return (
    <div className="relative">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onAddEvent={() => {
          setFormInitialDate(undefined);
          setEditingEvent(null);
          setIsFormOpen(true);
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <CalendarGrid
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={handleDayClick}
          />
        </div>
        <div className="lg:col-span-1 hidden lg:block">
          <UpcomingSidebar
            events={events}
            onEventClick={onViewDetail}
            onDateClick={(date) => {
              setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
              // Trigger click on that day
              setTimeout(() => {
                const dayButton = document.querySelector(
                  `[data-date="${date.toISOString().split("T")[0]}"]`
                ) as HTMLButtonElement;
                if (dayButton) {
                  dayButton.click();
                }
              }, 100);
            }}
          />
        </div>
      </div>

      {selectedDate && selectedDateEvents.length > 0 && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedDate(null)}
            />
          )}
          <EventPopover
            events={selectedDateEvents}
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
            onViewDetail={onViewDetail}
            onEdit={(event) => {
              setEditingEvent(event);
              const normalizedDeadline = normalizeDeadlineToDateString(event.deadline);
              if (normalizedDeadline) {
                setFormInitialDate(new Date(normalizedDeadline));
              }
              setIsFormOpen(true);
              setSelectedDate(null);
            }}
            onDelete={handleDeleteEvent}
            position={popoverPosition || undefined}
            isMobile={isMobile}
          />
        </>
      )}

      <CalendarEventForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
          setFormInitialDate(undefined);
        }}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        initialDate={formInitialDate}
        initialEvent={editingEvent ? {
          id: editingEvent.id,
          title: editingEvent.title,
          description: editingEvent.description,
          deadline: editingEvent.deadline,
          urgency: editingEvent.urgency,
          documentId: editingEvent.documentId,
          documentName: editingEvent.documentName,
          type: editingEvent.type,
        } : undefined}
      />
    </div>
  );
}

