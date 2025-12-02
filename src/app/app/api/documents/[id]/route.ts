import { NextRequest, NextResponse } from "next/server";
import { getDocumentById, updateDocumentById } from "@/src/lib/firebase/firestore-documents";
import { requireAuth } from "@/src/lib/auth/api-auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[API Documents] ===== GET DOCUMENT BY ID REQUEST START =====");
  try {
    // Require authentication and get userId
    const userId = await requireAuth(request);
    console.log("[API Documents] User authenticated:", userId);
    
    const { id } = await params;
    console.log("[API Documents] Document ID:", id);
    console.log("[API Documents] Request URL:", request.url);
    
    // Get document with ownership check
    console.log("[API Documents] Calling getDocumentById...");
    const document = await getDocumentById(id, userId);
    console.log("[API Documents] getDocumentById returned:", {
      found: !!document,
      hasId: !!document?.id,
      hasFileName: !!document?.fileName,
      documentId: document?.id,
    });

    if (!document) {
      console.log("[API Documents] Document not found or access denied");
      console.log("[API Documents] ===== GET DOCUMENT BY ID - NOT FOUND =====");
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("[API Documents] ===== GET DOCUMENT BY ID SUCCESS =====");
    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("[API Documents] ===== GET DOCUMENT BY ID ERROR =====");
    console.error("[API Documents] Error:", error);
    console.error("[API Documents] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[API Documents] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
    });
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    // Handle Admin SDK initialization errors
    if (error instanceof Error && error.message.includes("not initialized")) {
      console.error("[API Documents] Admin SDK not initialized - check FIREBASE_SERVICE_ACCOUNT_KEY");
      return NextResponse.json(
        {
          error: "서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.",
          details: "Firebase Admin SDK가 초기화되지 않았습니다.",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: "문서를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /app/api/documents/[id]
 * Update document properties (e.g., fileName)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[API Documents] ===== UPDATE DOCUMENT REQUEST START =====");
  try {
    // Require authentication and get userId
    const userId = await requireAuth(request);
    console.log("[API Documents] User authenticated:", userId);
    
    const { id } = await params;
    console.log("[API Documents] Document ID:", id);
    
    const body = await request.json();
    const { fileName } = body;
    console.log("[API Documents] Update request:", { fileName });

    // Validate fileName if provided
    if (fileName !== undefined) {
      if (typeof fileName !== "string" || fileName.trim().length === 0) {
        return NextResponse.json(
          { error: "파일명이 유효하지 않습니다." },
          { status: 400 }
        );
      }
      
      // Limit filename length
      if (fileName.length > 100) {
        return NextResponse.json(
          { error: "파일명은 100자를 초과할 수 없습니다." },
          { status: 400 }
        );
      }
    }

    // Check if document exists and user has access
    const existingDoc = await getDocumentById(id, userId);
    if (!existingDoc) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Update the document
    const updates: { fileName?: string } = {};
    if (fileName) {
      updates.fileName = fileName.trim();
    }

    await updateDocumentById(id, updates, userId);
    
    // Get the updated document
    const updatedDoc = await getDocumentById(id, userId);
    
    console.log("[API Documents] Document updated:", {
      id,
      fileName: updatedDoc?.fileName,
    });

    console.log("[API Documents] ===== UPDATE DOCUMENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      document: updatedDoc,
    });
  } catch (error) {
    console.error("[API Documents] Update document error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "문서 업데이트 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

