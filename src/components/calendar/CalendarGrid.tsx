"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CalendarDay } from "./CalendarDay";

interface CalendarGridProps {
  currentDate: Date;
  eventsByDate: Map<string, Array<{
    id: string;
    title: string;
    urgency: "critical" | "high" | "medium" | "low" | "action";
  }>>;
  onDayClick: (date: Date, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function CalendarGrid({
  currentDate,
  eventsByDate,
  onDayClick,
}: CalendarGridProps) {
  const t = useTranslations();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const DAYS_OF_WEEK = [
    t("calendar.daysOfWeek.sun"),
    t("calendar.daysOfWeek.mon"),
    t("calendar.daysOfWeek.tue"),
    t("calendar.daysOfWeek.wed"),
    t("calendar.daysOfWeek.thu"),
    t("calendar.daysOfWeek.fri"),
    t("calendar.daysOfWeek.sat"),
  ];

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get days from previous month to fill the grid
  const prevMonth = new Date(year, month - 1, 0);
  const daysFromPrevMonth = prevMonth.getDate();
  
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Add days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysFromPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Add days from next month to complete the grid (6 rows = 42 days)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-[#6D6D6D] dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateKey = getDateKey(day.date);
          const events = eventsByDate.get(dateKey) || [];
          const isToday =
            day.date.getTime() === today.getTime() && day.isCurrentMonth;

          return (
            <CalendarDay
              key={index}
              date={day.date}
              isCurrentMonth={day.isCurrentMonth}
              isToday={isToday}
              events={events}
              onClick={(date, event) => onDayClick(date, event)}
            />
          );
        })}
      </div>
    </div>
  );
}

