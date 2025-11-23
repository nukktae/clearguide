import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getSummaryById } from "@/src/lib/firebase/firestore-summary";

export const runtime = "nodejs";

/**
 * GET /app/api/summary/{id}
 * Get a specific summary by ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   summary: {
 *     summary: Summary
 *     documentId: string
 *     createdAt: Date
 *     updatedAt: Date
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const summaryId = params.id;

    if (!summaryId) {
      return NextResponse.json(
        { error: "summaryId가 필요합니다." },
        { status: 400 }
      );
    }

    const summary = await getSummaryById(summaryId, userId);

    if (!summary) {
      return NextResponse.json(
        { error: "요약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[API] Get summary error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "요약을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

