import { NextRequest, NextResponse } from "next/server";
import { extractRisks } from "@/src/lib/parsing/documentParser";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";
import { saveRisks, getAllUserRisks, getRisksByDocumentId } from "@/src/lib/firebase/firestore-risks";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /app/api/risks
 * Create risk alerts for a document
 * 
 * Purpose: Identify critical information (penalties, deadlines, warnings) to prevent mistakes
 * Goal: Reduce citizen confusion and reduce call center load by proactively alerting users
 * Social Impact: Prevent missed deadlines and benefit cancellations
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
 *   risksId: string
 *   risks: RiskAlert[]
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Risks] ===== CREATE RISKS REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Risks] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId, rawText, ocrId } = body;
    console.log("[API Risks] Request body:", { documentId, hasRawText: !!rawText, hasOcrId: !!ocrId });

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

    // Extract risk alerts using AI
    console.log("[API Risks] Extracting risk alerts from text...");
    const risks = await extractRisks(textToParse);

    // Save risk alerts to Firestore
    console.log("[API Risks] Saving risk alerts to Firestore...");
    const risksId = await saveRisks(userId, documentId, risks);
    console.log("[API Risks] Risk alerts saved:", {
      risksId,
      documentId,
      risksCount: risks.length,
    });

    console.log("[API Risks] ===== CREATE RISKS SUCCESS =====");
    return NextResponse.json({
      success: true,
      risksId,
      risks,
    });
  } catch (error) {
    console.error("[API] Create risks error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "위험 알림 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /app/api/risks
 * Get all risk alerts for the authenticated user
 * 
 * Query params:
 *   documentId (optional) - Filter by document ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   risks: Array<{
 *     id: string
 *     documentId: string
 *     risks: RiskAlert[]
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

    // If documentId is provided, get risks for that document
    if (documentId) {
      const risks = await getRisksByDocumentId(documentId, userId);
      
      if (!risks) {
        return NextResponse.json({
          success: true,
          risks: null,
        });
      }

      return NextResponse.json({
        success: true,
        risks,
      });
    }

    // Otherwise, get all risk alerts for the user
    const allRisks = await getAllUserRisks(userId);

    return NextResponse.json({
      success: true,
      risks: allRisks,
      count: allRisks.length,
    });
  } catch (error) {
    console.error("[API] Get risks error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "위험 알림 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

