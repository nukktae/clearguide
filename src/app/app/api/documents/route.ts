import { NextRequest, NextResponse } from "next/server";
import {
  getAllUserDocuments,
  saveDocument,
  updateDocumentById,
  getDocumentById,
} from "@/src/lib/firebase/firestore-documents";
import { DocumentRecord, ParsedDocument } from "@/src/lib/parsing/types";
import { requireAuth } from "@/src/lib/auth/api-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  console.log("[API Documents] ===== GET ALL DOCUMENTS REQUEST START =====");
  try {
    // Require authentication and get userId
    const userId = await requireAuth(request);
    console.log("[API Documents] User authenticated:", userId);
    
    // Get user's documents from Firestore
    console.log("[API Documents] Fetching user documents...");
    const documents = await getAllUserDocuments(userId);
    console.log("[API Documents] Documents fetched:", {
      count: documents.length,
      documentIds: documents.map(d => d.id),
    });

    console.log("[API Documents] ===== GET ALL DOCUMENTS SUCCESS =====");
    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("[API Documents] Get documents error:", error);
    console.error("[API] Error details:", {
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
    
    // Check if it's a permissions error
    if (error instanceof Error && (error.message.includes("permission") || error.message.includes("Missing"))) {
      return NextResponse.json(
        {
          error: "Firestore 권한 오류가 발생했습니다.",
          details: "Firestore 보안 규칙을 배포했는지 확인하세요. 또는 테스트 모드로 설정되어 있는지 확인하세요.",
          hint: "Firebase Console → Firestore → Rules에서 규칙을 배포하세요."
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        error: "문서 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("[API Documents] ===== SAVE DOCUMENT REQUEST START =====");
  try {
    // Require authentication and get userId
    const userId = await requireAuth(request);
    console.log("[API Documents] User authenticated:", userId);
    
    const body = await request.json();
    const { document, parsedDocument } = body;
    console.log("[API Documents] Request body:", {
      documentId: document?.id,
      hasParsed: !!parsedDocument,
      hasSummary: !!parsedDocument?.summary,
      hasActions: !!parsedDocument?.actions,
    });

    if (!document) {
      return NextResponse.json(
        { error: "document 객체가 필요합니다." },
        { status: 400 }
      );
    }

    // Check if document already exists - if so, only update the parsed field
    // This preserves original document fields like fileName, fileType, filePath
    const existingDoc = await getDocumentById(document.id, userId);
    
    if (existingDoc) {
      // Document exists - update only the parsed field
      console.log("[API Documents] Document exists, updating parsed field only...");
      await updateDocumentById(document.id, { parsed: parsedDocument }, userId);
      
      // Return the existing document with updated parsed data
      const updatedDoc = {
        ...existingDoc,
        parsed: parsedDocument,
      };
      
      console.log("[API Documents] Document updated:", {
        documentId: updatedDoc.id,
        hasParsed: !!updatedDoc.parsed,
        fileName: updatedDoc.fileName,
        filePath: updatedDoc.filePath,
      });

      console.log("[API Documents] ===== SAVE DOCUMENT SUCCESS =====");
      return NextResponse.json({
        success: true,
        document: updatedDoc,
      });
    } else {
      // New document - create it
    const documentRecord: DocumentRecord = {
      ...document,
      parsed: parsedDocument as ParsedDocument | undefined,
    };

    // Save to Firestore with userId
      console.log("[API Documents] Saving new document to Firestore...");
    const saved = await saveDocument(documentRecord, userId);
    console.log("[API Documents] Document saved:", {
      documentId: saved.id,
      hasParsed: !!saved.parsed,
    });

    console.log("[API Documents] ===== SAVE DOCUMENT SUCCESS =====");
    return NextResponse.json({
      success: true,
      document: saved,
    });
    }
  } catch (error) {
    console.error("Save document error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "문서 저장 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

