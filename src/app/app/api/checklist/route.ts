import { NextRequest, NextResponse } from "next/server";
import { extractChecklist } from "@/src/lib/parsing/documentParser";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";
import { saveChecklist, getAllUserChecklists } from "@/src/lib/firebase/firestore-checklist";
import { extractUrls, extractBankAccountInfo } from "@/src/lib/utils/textExtraction";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /app/api/checklist
 * Create a checklist for a document
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
 *   checklistId: string
 *   actions: ChecklistItem[]
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Checklist] ===== CREATE CHECKLIST REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Checklist] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId, rawText, ocrId } = body;
    console.log("[API Checklist] Request body:", { documentId, hasRawText: !!rawText, hasOcrId: !!ocrId });

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

    // Extract checklist
    let actions = await extractChecklist(textToParse);
    
    // Enhance actions with extracted URLs and bank account info from OCR text
    const urls = extractUrls(textToParse);
    const bankInfo = extractBankAccountInfo(textToParse);
    
    console.log("[API Checklist] Extracted data:", {
      urls: urls.length,
      hasBankInfo: !!(bankInfo.accountHolder || bankInfo.bankName || bankInfo.accountNumber || bankInfo.giroNumber),
    });
    
    // Add URLs and bank info to actions that need them
    actions = actions.map(action => {
      // If online action and has no websiteUrl, try to find URL from extracted URLs
      if (action.locationType === "online" && !action.websiteUrl && urls.length > 0) {
        action.websiteUrl = urls[0]; // Use first URL found
        console.log("[API Checklist] Added websiteUrl to action:", action.id, action.websiteUrl);
      }
      
      // If online action and has no bankAccount, add extracted bank info
      if (action.locationType === "online" && !action.bankAccount && 
          (bankInfo.accountHolder || bankInfo.bankName || bankInfo.accountNumber || bankInfo.giroNumber)) {
        action.bankAccount = bankInfo;
        console.log("[API Checklist] Added bankAccount to action:", action.id, bankInfo);
      }
      
      return action;
    });

    // Save checklist to Firestore
    console.log("[API Checklist] Saving checklist to Firestore...");
    const checklistId = await saveChecklist(userId, documentId, actions);
    console.log("[API Checklist] Checklist saved:", {
      checklistId,
      documentId,
      actionsCount: actions.length,
    });

    console.log("[API Checklist] ===== CREATE CHECKLIST SUCCESS =====");
    return NextResponse.json({
      success: true,
      checklistId,
      actions,
    });
  } catch (error) {
    console.error("[API] Create checklist error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "체크리스트 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /app/api/checklist
 * Get all checklists for the authenticated user
 * 
 * Query params:
 *   documentId (optional) - Filter by document ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   checklists: Array<{
 *     id: string
 *     documentId: string
 *     actions: ChecklistItem[]
 *     createdAt: Date
 *     updatedAt: Date
 *   }>
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  console.log("[API Checklist] ===== GET CHECKLIST REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Checklist] User authenticated:", userId);
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    console.log("[API Checklist] Query params:", { documentId });

    // If documentId is provided, get checklist for that document
    if (documentId) {
      console.log("[API Checklist] Fetching checklist by documentId...");
      const { getChecklistByDocumentId } = await import("@/src/lib/firebase/firestore-checklist");
      const checklist = await getChecklistByDocumentId(documentId, userId);
      console.log("[API Checklist] Checklist fetched:", {
        found: !!checklist,
        actionsCount: checklist?.actions.length || 0,
      });
      
      if (!checklist) {
        console.log("[API Checklist] ===== GET CHECKLIST SUCCESS (NOT FOUND) =====");
        return NextResponse.json({
          success: true,
          checklist: null,
        });
      }

      console.log("[API Checklist] ===== GET CHECKLIST SUCCESS =====");
      return NextResponse.json({
        success: true,
        checklist,
      });
    }

    // Otherwise, get all checklists for the user
    console.log("[API Checklist] Fetching all user checklists...");
    const checklists = await getAllUserChecklists(userId);
    console.log("[API Checklist] All checklists fetched:", {
      count: checklists.length,
    });

    console.log("[API Checklist] ===== GET ALL CHECKLISTS SUCCESS =====");
    return NextResponse.json({
      success: true,
      checklists,
      count: checklists.length,
    });
  } catch (error) {
    console.error("[API Checklist] Get checklists error:", error);
    console.error("[API Checklist] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "체크리스트 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

