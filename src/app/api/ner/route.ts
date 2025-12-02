import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { createNERClient } from "@/src/lib/ner/client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /app/api/ner
 * Extract named entities from text using Korean NER model
 * 
 * Body:
 *   {
 *     "text": "text to extract entities from"
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   result: {
 *     entities: NEREntity[]
 *     text: string
 *     model: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API NER] ===== NER REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API NER] User authenticated:", userId);

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "텍스트가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("[API NER] Extracting entities from text (length:", text.length, ")");

    // Create NER client and extract entities
    const nerClient = createNERClient();
    const result = await nerClient.extractEntities(text);

    console.log("[API NER] Extraction complete:", {
      entitiesCount: result.entities.length,
      model: result.model,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[API NER] Error:", error);
    return NextResponse.json(
      {
        error: "개체명 추출 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

