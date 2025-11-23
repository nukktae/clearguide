import { NextRequest, NextResponse } from "next/server";
import { getDocumentById } from "@/src/lib/firebase/firestore-documents";
import { requireAuth } from "@/src/lib/auth/api-auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and get userId
    const userId = await requireAuth(request);
    console.log("[API] Getting document, userId:", userId);
    
    const { id } = await params;
    console.log("[API] Document ID:", id);
    
    // Get document with ownership check
    const document = await getDocumentById(id, userId);
    console.log("[API] Document found:", !!document);

    if (!document) {
      console.log("[API] Document not found or access denied");
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("[API] Get document error:", error);
    console.error("[API] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[API] Error details:", {
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
    
    return NextResponse.json(
      {
        error: "문서를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

