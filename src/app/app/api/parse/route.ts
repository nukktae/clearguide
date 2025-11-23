import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/src/lib/parsing/documentParser";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[API Parse] ===== PARSE REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Parse] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId, rawText, ocrId } = body;
    console.log("[API Parse] Request body:", { documentId, hasRawText: !!rawText, hasOcrId: !!ocrId });

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

    // documentId is required for parsing
    if (!documentId) {
      return NextResponse.json(
        { error: "documentId가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("[API Parse] Parsing document...");
    const parsedDocument = await parseDocument(textToParse, documentId);
    console.log("[API Parse] Document parsed:", {
      documentId: parsedDocument.documentId,
      summaryBullets: parsedDocument.summary.bullets.length,
      actionsCount: parsedDocument.actions.length,
      risksCount: parsedDocument.risks.length,
    });

    console.log("[API Parse] ===== PARSE SUCCESS =====");
    return NextResponse.json({
      success: true,
      parsedDocument,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error: "문서 분석 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

