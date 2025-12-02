import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import {
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/src/lib/firebase/firestore-calendar";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /app/api/calendar/[id]
 * Get a specific calendar event by ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   event: CalendarEvent | null
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[API Calendar] ===== GET CALENDAR EVENT REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Calendar] User authenticated:", userId);
    
    const { id } = await params;
    const eventId = id;
    console.log("[API Calendar] Fetching event:", eventId);

    const event = await getCalendarEventById(eventId, userId);

    if (!event) {
      console.log("[API Calendar] Event not found");
      return NextResponse.json({
        success: true,
        event: null,
      });
    }

    console.log("[API Calendar] ===== GET CALENDAR EVENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("[API] Get calendar event error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "캘린더 이벤트를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /app/api/calendar/[id]
 * Update a calendar event
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "title": "Updated title" (optional),
 *     "description": "Updated description" (optional),
 *     "deadline": "YYYY-MM-DD" (optional),
 *     "urgency": "critical" | "high" | "medium" | "low" | "action" (optional),
 *     "documentId": "uuid-of-document" (optional),
 *     "documentName": "document name" (optional),
 *     "type": "custom" | "action" | "risk" (optional),
 *     "severity": "low" | "medium" | "high" | "critical" (optional)
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   event: CalendarEvent
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[API Calendar] ===== UPDATE CALENDAR EVENT REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Calendar] User authenticated:", userId);
    
    const { id } = await params;
    const eventId = id;
    const body = await request.json();
    const {
      title,
      description,
      deadline,
      urgency,
      documentId,
      documentName,
      type,
      severity,
    } = body;

    // Validate deadline format if provided
    if (deadline) {
      const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!deadlineRegex.test(deadline)) {
        return NextResponse.json(
          { error: "마감일 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요." },
          { status: 400 }
        );
      }
    }

    // Validate urgency if provided
    if (urgency) {
      const validUrgencies = ["critical", "high", "medium", "low", "action"];
      if (!validUrgencies.includes(urgency)) {
        return NextResponse.json(
          { error: "유효한 긴급도가 필요합니다. (critical, high, medium, low, action)" },
          { status: 400 }
        );
      }
    }

    // Update calendar event
    console.log("[API Calendar] Updating calendar event:", eventId);
    await updateCalendarEvent(eventId, userId, {
      title,
      description,
      deadline,
      urgency,
      documentId,
      documentName,
      type,
      severity,
    });

    // Get the updated event
    const event = await getCalendarEventById(eventId, userId);

    if (!event) {
      throw new Error("Failed to retrieve updated event");
    }

    console.log("[API Calendar] ===== UPDATE CALENDAR EVENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("[API] Update calendar event error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "캘린더 이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "캘린더 이벤트 업데이트 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /app/api/calendar/[id]
 * Delete a calendar event
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   message: string
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[API Calendar] ===== DELETE CALENDAR EVENT REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Calendar] User authenticated:", userId);
    
    const { id } = await params;
    const eventId = id;
    console.log("[API Calendar] Deleting event:", eventId);

    await deleteCalendarEvent(eventId, userId);

    console.log("[API Calendar] ===== DELETE CALENDAR EVENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      message: "캘린더 이벤트가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[API] Delete calendar event error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "캘린더 이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "캘린더 이벤트 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

