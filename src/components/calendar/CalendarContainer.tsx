"use client";

import * as React from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { EventPopover } from "./EventPopover";
import { UpcomingSidebar } from "./UpcomingSidebar";

interface CalendarContainerProps {
  events: Array<{
    id: string;
    title: string;
    deadline: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
    documentName: string;
    documentId: string;
    description?: string;
  }>;
  onViewDetail: (documentId: string) => void;
}

export function CalendarContainer({
  events,
  onViewDetail,
}: CalendarContainerProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [popoverPosition, setPopoverPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

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
            position={popoverPosition || undefined}
            isMobile={isMobile}
          />
        </>
      )}
    </div>
  );
}

