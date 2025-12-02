import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/src/lib/parsing/documentParser";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";
// Hybrid model imports
import { createNERClient } from "@/src/lib/ner/client";
import { extractRelations } from "@/src/lib/parsing/relation-extraction";
import { mergeNERAndRegex, addRelationsToMergedData } from "@/src/lib/parsing/hybrid-merger";
import { buildCanonicalOutput } from "@/src/lib/parsing/canonical-output";
import { saveCanonicalData } from "@/src/lib/firebase/firestore-canonical";
// PII masking imports
import { maskAll } from "@/src/lib/privacy/masker";
import { getPrivacySettings } from "@/src/lib/firebase/firestore-privacy";
import { deleteNow } from "@/src/lib/privacy/retention";

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

    // Get user privacy settings
    const privacySettings = await getPrivacySettings(userId);
    console.log("[API Parse] Privacy settings:", {
      maskingMode: privacySettings.maskingMode,
      autoDelete: privacySettings.autoDelete,
    });

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
      // OCR text is already masked (saved masked in OCR route)
      textToParse = ocrResult.text;
    } else if (rawText) {
      // Mask rawText if privacy settings require it
      if (privacySettings.maskBeforeLLM) {
        const maskedResult = maskAll(rawText, {
          mode: privacySettings.maskingMode,
          preserveFormat: true,
        });
        textToParse = maskedResult.maskedText;
        console.log("[API Parse] Masked rawText before parsing:", {
          piiTypesFound: maskedResult.metadata.piiTypes,
          itemsMasked: maskedResult.metadata.maskedItems.length,
        });
      } else {
        textToParse = rawText;
      }
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

    console.log("[API Parse] Parsing document with masked text...");
    const parsedDocument = await parseDocument(textToParse, documentId);
    console.log("[API Parse] Document parsed:", {
      documentId: parsedDocument.documentId,
      summaryBullets: parsedDocument.summary.bullets.length,
      actionsCount: parsedDocument.actions.length,
      risksCount: parsedDocument.risks.length,
    });

    // Run hybrid extraction (NER + RE) for canonical output
    let canonicalData = null;
    try {
      console.log("[API Parse] Running hybrid extraction (NER + RE)...");
      
      // Step 1: Run NER extraction
      let nerEntities: any[] = [];
      try {
        const nerClient = createNERClient();
        const nerResult = await nerClient.extractEntities(textToParse);
        nerEntities = nerResult.entities;
        console.log("[API Parse] NER extraction complete:", {
          entitiesCount: nerEntities.length,
          model: nerResult.model,
        });
      } catch (nerError) {
        console.warn("[API Parse] NER extraction failed, continuing with regex-only:", nerError);
      }

      // Step 2: Merge NER + regex
      const mergedData = mergeNERAndRegex(nerEntities, textToParse);

      // Step 3: Extract relations
      const relations = extractRelations(textToParse, mergedData.entities);
      const mergedDataWithRelations = addRelationsToMergedData(mergedData, relations.relations);
      
      console.log("[API Parse] Relation extraction complete:", {
        relationsCount: relations.relations.length,
      });

      // Step 4: Build canonical output
      canonicalData = buildCanonicalOutput(mergedDataWithRelations, documentId);
      
      console.log("[API Parse] Canonical output built:", {
        deadlines: canonicalData.deadlines.length,
        actions: canonicalData.required_actions.length,
        penalties: canonicalData.penalties.length,
        source: canonicalData.source,
      });

      // Step 5: Optionally save canonical data to Firestore
      try {
        await saveCanonicalData(userId, canonicalData);
        console.log("[API Parse] Canonical data saved to Firestore");
      } catch (saveError) {
        console.warn("[API Parse] Failed to save canonical data to Firestore:", saveError);
        // Non-critical - continue without saving
      }
    } catch (hybridError) {
      console.error("[API Parse] Hybrid extraction failed:", hybridError);
      // Continue without canonical data - not critical for parsing
    }

    // Handle auto-delete after parsing if configured
    if (privacySettings.autoDelete === "immediate") {
      console.log("[API Parse] Auto-delete is set to immediate, deleting document after parsing...");
      await deleteNow(documentId, userId);
    }

    console.log("[API Parse] ===== PARSE SUCCESS =====");
    return NextResponse.json({
      success: true,
      parsedDocument,
      canonicalData, // Include canonical output if available
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

