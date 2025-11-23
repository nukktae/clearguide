import { NextRequest, NextResponse } from "next/server";
import { extractTextWithGPT4o } from "@/src/lib/ocr/ocrClient";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { saveOCRResult, getAllUserOCRResults } from "@/src/lib/firebase/firestore-ocr";
import { getDocumentById } from "@/src/lib/firebase/firestore-documents";
import { getFilePath, fileExists } from "@/src/lib/storage/files";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /app/api/ocr
 * Get all OCR results for the authenticated user
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   ocrResults: Array<{
 *     id: string
 *     text: string
 *     confidence?: number
 *     pageCount?: number
 *     fileType: string
 *     fileName: string
 *     createdAt: Date
 *   }>
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  console.log("[API OCR] ===== GET OCR RESULTS REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API OCR] User authenticated:", userId);
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const fileName = searchParams.get("fileName");
    
    // If documentId is provided, get document first to get fileName
    if (documentId) {
      console.log("[API OCR] Fetching OCR by documentId:", documentId);
      const { getDocumentById } = await import("@/src/lib/firebase/firestore-documents");
      const document = await getDocumentById(documentId, userId);
      
      if (!document) {
        console.log("[API OCR] Document not found");
        return NextResponse.json({
          success: true,
          ocrResult: null,
        });
      }
      
      console.log("[API OCR] Document found, fetching OCR by fileName:", document.fileName);
      const { getOCRResultByFileName } = await import("@/src/lib/firebase/firestore-ocr");
      const ocrResult = await getOCRResultByFileName(document.fileName, userId);
      
      if (!ocrResult) {
        console.log("[API OCR] OCR result not found for fileName");
        return NextResponse.json({
          success: true,
          ocrResult: null,
        });
      }
      
      console.log("[API OCR] ===== GET OCR BY DOCUMENT ID SUCCESS =====");
      return NextResponse.json({
        success: true,
        ocrResult: {
          id: ocrResult.id,
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          pageCount: ocrResult.pageCount,
          createdAt: ocrResult.createdAt,
        },
      });
    }
    
    // If fileName is provided, get OCR by fileName
    if (fileName) {
      console.log("[API OCR] Fetching OCR by fileName:", fileName);
      const { getOCRResultByFileName } = await import("@/src/lib/firebase/firestore-ocr");
      const ocrResult = await getOCRResultByFileName(fileName, userId);
      
      if (!ocrResult) {
        console.log("[API OCR] OCR result not found");
        return NextResponse.json({
          success: true,
          ocrResult: null,
        });
      }
      
      console.log("[API OCR] ===== GET OCR BY FILE NAME SUCCESS =====");
      return NextResponse.json({
        success: true,
        ocrResult: {
          id: ocrResult.id,
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          pageCount: ocrResult.pageCount,
          createdAt: ocrResult.createdAt,
        },
      });
    }
    
    // Otherwise, get all OCR results for the user
    console.log("[API OCR] Fetching all OCR results for user...");
    const ocrResults = await getAllUserOCRResults(userId);
    console.log("[API OCR] OCR results fetched:", { count: ocrResults.length });

    console.log("[API OCR] ===== GET ALL OCR RESULTS SUCCESS =====");
    return NextResponse.json({
      success: true,
      ocrResults,
      count: ocrResults.length,
    });
  } catch (error) {
    console.error("[API] Get OCR results error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "OCR 결과 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /app/api/ocr
 * Extract text from uploaded document using GPT-4o vision API
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "documentId": "uuid-of-uploaded-document"
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   ocrId: string (use this ID to get summary, checklist, etc.)
 *   text: string (extracted text)
 *   confidence?: number
 *   pageCount?: number
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API OCR] ===== OCR REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API OCR] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId } = body;
    console.log("[API OCR] Request body:", { documentId });

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId가 필요합니다." },
        { status: 400 }
      );
    }

    // Get document from Firestore to verify ownership and get file info
    const document = await getDocumentById(documentId, userId);
    
    if (!document) {
      console.error("[API OCR] Document not found:", { documentId, userId });
      return NextResponse.json(
        { 
          error: "문서를 찾을 수 없거나 접근 권한이 없습니다.",
          details: `Document ID: ${documentId}, User ID: ${userId}`
        },
        { status: 404 }
      );
    }

    console.log("[API OCR] Document found:", { 
      documentId: document.id, 
      filePath: document.filePath,
      fileName: document.fileName 
    });

    if (!document.filePath) {
      console.error("[API OCR] Document missing filePath:", { documentId, document });
      return NextResponse.json(
        { 
          error: "문서 파일 경로를 찾을 수 없습니다.",
          details: `Document ID: ${documentId} has no filePath`
        },
        { status: 404 }
      );
    }

    // Check if file exists on disk
    const fileExistsResult = await fileExists(document.filePath);
    if (!fileExistsResult) {
      const fullPath = getFilePath(document.filePath);
      console.error("[API OCR] File not found on disk:", { 
        filePath: document.filePath,
        fullPath,
        documentId 
      });
      return NextResponse.json(
        { 
          error: "파일을 찾을 수 없습니다.",
          details: `File path: ${document.filePath}, Full path: ${fullPath}`
        },
        { status: 404 }
      );
    }

    // Read file from disk
    const filePath = getFilePath(document.filePath);
    const fileBuffer = await fs.readFile(filePath);
    
    // Convert buffer to File object for OCR
    const fileBlob = new Blob([fileBuffer], { type: document.fileType });
    const file = new File([fileBlob], document.fileName, { type: document.fileType });

    // Extract text using GPT-4o vision
    const ocrResult = await extractTextWithGPT4o(file);

    // Save OCR result to Firestore and get OCR ID
    console.log("[API OCR] Saving OCR result to Firestore...");
    const ocrId = await saveOCRResult(
      userId,
      ocrResult.text,
      document.fileType,
      document.fileName,
      ocrResult.confidence,
      ocrResult.pageCount
    );
    console.log("[API OCR] OCR result saved:", {
      ocrId,
      textLength: ocrResult.text.length,
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount,
    });

    console.log("[API OCR] ===== OCR SUCCESS =====");
    return NextResponse.json({
      success: true,
      ocrId,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount,
    });
  } catch (error) {
    console.error("[API] OCR error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "OCR 처리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

