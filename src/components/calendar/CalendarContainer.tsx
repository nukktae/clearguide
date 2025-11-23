"use client";

import * as React from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { EventPopover } from "./EventPopover";
import { UpcomingSidebar } from "./UpcomingSidebar";
import { CalendarEventForm } from "./CalendarEventForm";

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
      const dateKey = new Date(event.deadline).toISOString().split("T")[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const handleDayClick = React.useCallback((date: Date, event: React.MouseEvent<HTMLButtonElement>) => {
    const dateKey = date.toISOString().split("T")[0];
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
      const response = await fetch("/app/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
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

      const response = await fetch(`/app/api/calendar/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
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
      const response = await fetch(`/app/api/calendar/${id}`, {
        method: "DELETE",
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
              setFormInitialDate(new Date(event.deadline));
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

