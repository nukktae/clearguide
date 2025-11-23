import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import {
  saveCalendarEvent,
  getAllUserCalendarEvents,
} from "@/src/lib/firebase/firestore-calendar";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /app/api/calendar
 * Create a custom calendar event
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "title": "Event title",
 *     "description": "Event description" (optional),
 *     "deadline": "YYYY-MM-DD",
 *     "urgency": "critical" | "high" | "medium" | "low" | "action",
 *     "documentId": "uuid-of-document" (optional),
 *     "documentName": "document name" (optional),
 *     "type": "custom" | "action" | "risk" (optional, defaults to "custom"),
 *     "severity": "low" | "medium" | "high" | "critical" (optional, for risk events)
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   eventId: string
 *   event: CalendarEvent
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Calendar] ===== CREATE CALENDAR EVENT REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Calendar] User authenticated:", userId);
    
    const body = await request.json();
    const {
      title,
      description,
      deadline,
      urgency,
      documentId,
      documentName,
      type = "custom",
      severity,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "제목이 필요합니다." },
        { status: 400 }
      );
    }

    if (!deadline) {
      return NextResponse.json(
        { error: "마감일이 필요합니다." },
        { status: 400 }
      );
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadlineRegex.test(deadline)) {
      return NextResponse.json(
        { error: "마감일 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요." },
        { status: 400 }
      );
    }

    // Validate urgency
    const validUrgencies = ["critical", "high", "medium", "low", "action"];
    if (!urgency || !validUrgencies.includes(urgency)) {
      return NextResponse.json(
        { error: "유효한 긴급도가 필요합니다. (critical, high, medium, low, action)" },
        { status: 400 }
      );
    }

    // Create calendar event
    console.log("[API Calendar] Creating calendar event...");
    const eventId = await saveCalendarEvent(userId, {
      title,
      description,
      deadline,
      urgency,
      documentId,
      documentName,
      type,
      severity,
    });

    // Get the created event
    const { getCalendarEventById } = await import("@/src/lib/firebase/firestore-calendar");
    const event = await getCalendarEventById(eventId, userId);

    if (!event) {
      throw new Error("Failed to retrieve created event");
    }

    console.log("[API Calendar] Calendar event created:", {
      eventId,
      title,
      deadline,
    });

    console.log("[API Calendar] ===== CREATE CALENDAR EVENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      eventId,
      event,
    });
  } catch (error) {
    console.error("[API] Create calendar event error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "캘린더 이벤트 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /app/api/calendar
 * Get all calendar events for the authenticated user
 * 
 * Query params:
 *   startDate (optional) - Filter events from this date (YYYY-MM-DD)
 *   endDate (optional) - Filter events until this date (YYYY-MM-DD)
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   events: CalendarEvent[]
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  console.log("[API Calendar] ===== GET CALENDAR EVENTS REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Calendar] User authenticated:", userId);
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get all calendar events for the user
    const events = await getAllUserCalendarEvents(userId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    console.log("[API Calendar] Calendar events fetched:", { count: events.length });

    console.log("[API Calendar] ===== GET CALENDAR EVENTS SUCCESS =====");
    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("[API] Get calendar events error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "캘린더 이벤트 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

