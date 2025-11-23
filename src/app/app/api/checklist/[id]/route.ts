import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getChecklistById, updateChecklist } from "@/src/lib/firebase/firestore-checklist";
import type { ChecklistItem } from "@/src/lib/parsing/types";

export const runtime = "nodejs";

/**
 * GET /app/api/checklist/{id}
 * Get a specific checklist by ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   checklist: {
 *     actions: ChecklistItem[]
 *     documentId: string
 *     createdAt: Date
 *     updatedAt: Date
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const { id } = await params;
    const checklistId = id;

    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId가 필요합니다." },
        { status: 400 }
      );
    }

    const checklist = await getChecklistById(checklistId, userId);

    if (!checklist) {
      return NextResponse.json(
        { error: "체크리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error) {
    console.error("[API] Get checklist error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "체크리스트를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /app/api/checklist/{id}
 * Update a checklist (e.g., mark items as completed)
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "actions": ChecklistItem[]
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   message: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const { id } = await params;
    const checklistId = id;
    const body = await request.json();
    const { actions } = body;

    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: "actions 배열이 필요합니다." },
        { status: 400 }
      );
    }

    await updateChecklist(checklistId, userId, actions as ChecklistItem[]);

    return NextResponse.json({
      success: true,
      message: "체크리스트가 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("[API] Update checklist error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "체크리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "체크리스트 업데이트 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

