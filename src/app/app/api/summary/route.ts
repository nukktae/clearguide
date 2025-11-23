import { NextRequest, NextResponse } from "next/server";
import { extractSummary } from "@/src/lib/parsing/documentParser";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";
import { saveSummary, getAllUserSummaries } from "@/src/lib/firebase/firestore-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /app/api/summary
 * Create a summary for a document
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "documentId": "uuid-of-document",
 *     "ocrId": "uuid-of-ocr-result" (optional, if not provided, rawText is required),
 *     "rawText": "text content" (optional, if not provided, ocrId is required)
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   summaryId: string
 *   summary: Summary
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Summary] ===== CREATE SUMMARY REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Summary] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId, rawText, ocrId } = body;
    console.log("[API Summary] Request body:", { documentId, hasRawText: !!rawText, hasOcrId: !!ocrId });

    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: "documentId가 필요합니다." },
        { status: 400 }
      );
    }

    let textToParse: string;

    // If ocrId is provided, get text from Firestore
    if (ocrId) {
      const ocrResult = await getOCRResultById(ocrId, userId);
      if (!ocrResult) {
        return NextResponse.json(
          { error: "OCR 결과를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      textToParse = ocrResult.text;
    } else if (rawText) {
      // Use provided rawText
      textToParse = rawText;
    } else {
      return NextResponse.json(
        { error: "ocrId 또는 rawText가 필요합니다." },
        { status: 400 }
      );
    }

    // Extract summary
    const summary = await extractSummary(textToParse);

    // Save summary to Firestore
    console.log("[API Summary] Saving summary to Firestore...");
    const summaryId = await saveSummary(userId, documentId, summary);
    console.log("[API Summary] Summary saved:", {
      summaryId,
      documentId,
      bulletsCount: summary.bullets.length,
      docType: summary.docType,
    });

    console.log("[API Summary] ===== CREATE SUMMARY SUCCESS =====");
    return NextResponse.json({
      success: true,
      summaryId,
      summary,
    });
  } catch (error) {
    console.error("[API] Create summary error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "요약 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /app/api/summary
 * Get all summaries for the authenticated user
 * 
 * Query params:
 *   documentId (optional) - Filter by document ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   summaries: Array<{
 *     id: string
 *     documentId: string
 *     summary: Summary
 *     createdAt: Date
 *     updatedAt: Date
 *   }>
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    // If documentId is provided, get summary for that document
    if (documentId) {
      const { getSummaryByDocumentId } = await import("@/src/lib/firebase/firestore-summary");
      const summary = await getSummaryByDocumentId(documentId, userId);
      
      if (!summary) {
        return NextResponse.json({
          success: true,
          summary: null,
        });
      }

      return NextResponse.json({
        success: true,
        summary,
      });
    }

    // Otherwise, get all summaries for the user
    const summaries = await getAllUserSummaries(userId);

    return NextResponse.json({
      success: true,
      summaries,
      count: summaries.length,
    });
  } catch (error) {
    console.error("[API] Get summaries error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "요약 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

