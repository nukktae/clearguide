import { NextRequest, NextResponse } from "next/server";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";
import { requireAuth } from "@/src/lib/auth/api-auth";

export const runtime = "nodejs";

/**
 * GET /app/api/ocr/{ocrId}
 * Get OCR result by ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   text: string (extracted text)
 *   confidence?: number
 *   pageCount?: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const { id: ocrId } = await params;
    
    // Get OCR result with ownership check
    const ocrResult = await getOCRResultById(ocrId, userId);

    if (!ocrResult) {
      return NextResponse.json(
        { error: "OCR 결과를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ocrId,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount,
    });
  } catch (error) {
    console.error("[API] Get OCR error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "OCR 결과를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

