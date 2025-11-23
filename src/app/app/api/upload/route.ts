import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveUploadedFile } from "@/src/lib/storage/files";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { saveDocument } from "@/src/lib/firebase/firestore-documents";
import type { DocumentRecord } from "@/src/lib/parsing/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[API Upload] ===== UPLOAD REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Upload] User authenticated:", userId);
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log("[API Upload] File received:", {
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // Validate file size (20MB max for GPT-4o vision)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 20MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. PDF, JPG, PNG만 지원됩니다." },
        { status: 400 }
      );
    }

    // Save file to disk
    const documentId = uuidv4();
    const savedFileName = await saveUploadedFile(file, documentId);

    // Create document record (without OCR - OCR is separate endpoint)
    const documentRecord: DocumentRecord = {
      id: documentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      filePath: savedFileName,
    };

    // Automatically save to Firestore
    console.log("[API Upload] Saving document to Firestore...");
    const savedDocument = await saveDocument(documentRecord, userId);
    console.log("[API Upload] Document saved successfully:", {
      documentId: savedDocument.id,
      fileName: savedDocument.fileName,
    });

    console.log("[API Upload] ===== UPLOAD SUCCESS =====");
    return NextResponse.json({
      success: true,
      documentId: savedDocument.id,
      document: savedDocument,
    });
  } catch (error) {
    console.error("Upload error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "파일 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

