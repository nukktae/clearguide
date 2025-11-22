/**
 * Calendar utility for generating iCal files and calculating deadline days
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  url?: string;
}

/**
 * Calculate days until deadline (D-70 format)
 */
export function getDaysUntilDeadline(deadline: string): number | null {
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Format deadline with days remaining (e.g., "2025-01-31 (D-70)")
 */
export function formatDeadlineWithDays(deadline: string): string {
  const days = getDaysUntilDeadline(deadline);
  if (days === null) return deadline;
  
  if (days < 0) {
    return `${deadline} (기한 경과)`;
  } else if (days === 0) {
    return `${deadline} (D-day)`;
  } else {
    return `${deadline} (D-${days})`;
  }
}

/**
 * Get deadline status for color coding
 */
export type DeadlineStatus = "overdue" | "soon" | "okay";

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const days = getDaysUntilDeadline(deadline);
  if (days === null) return "okay";
  
  if (days < 0) {
    return "overdue";
  } else if (days <= 7) {
    return "soon";
  } else {
    return "okay";
  }
}

/**
 * Generate iCal file content
 */
export function generateICalFile(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const startDate = formatDate(event.startDate);
  const endDate = event.endDate ? formatDate(event.endDate) : startDate;

  let ical = "BEGIN:VCALENDAR\r\n";
  ical += "VERSION:2.0\r\n";
  ical += "PRODID:-//ClearGuide//Korean Public Document AI//KO\r\n";
  ical += "CALSCALE:GREGORIAN\r\n";
  ical += "METHOD:PUBLISH\r\n";
  ical += "BEGIN:VEVENT\r\n";
  ical += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@clearguide.kr\r\n`;
  ical += `DTSTART:${startDate}\r\n`;
  ical += `DTEND:${endDate}\r\n`;
  ical += `SUMMARY:${escapeText(event.title)}\r\n`;
  
  if (event.description) {
    ical += `DESCRIPTION:${escapeText(event.description)}\r\n`;
  }
  
  if (event.location) {
    ical += `LOCATION:${escapeText(event.location)}\r\n`;
  }
  
  if (event.url) {
    ical += `URL:${event.url}\r\n`;
  }
  
  ical += "STATUS:CONFIRMED\r\n";
  ical += "SEQUENCE:0\r\n";
  ical += "BEGIN:VALARM\r\n";
  ical += "TRIGGER:-P1D\r\n";
  ical += "ACTION:DISPLAY\r\n";
  ical += `DESCRIPTION:${escapeText(event.title)} 마감일 하루 전 알림\r\n`;
  ical += "END:VALARM\r\n";
  ical += "END:VEVENT\r\n";
  ical += "END:VCALENDAR\r\n";

  return ical;
}

/**
 * Download calendar event as .ics file
 */
export function downloadCalendarEvent(event: CalendarEvent, filename?: string): void {
  const icalContent = generateICalFile(event);
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse deadline string (YYYY-MM-DD) to Date
 */
export function parseDeadline(deadline: string): Date | null {
  try {
    // Handle YYYY-MM-DD format
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

