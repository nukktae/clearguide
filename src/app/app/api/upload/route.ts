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
  console.log("[API Upload] Environment:", {
    isVercel: process.env.VERCEL === "1",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL,
  });
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
      // HWP (Hancom) formats
      "application/vnd.hancom.hwp",
      "application/x-hwp",
      "application/haansofthwp",
      // Word formats
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const fileName = file.name.toLowerCase();
    const isValidByExtension = 
      fileName.endsWith(".hwp") || 
      fileName.endsWith(".doc") || 
      fileName.endsWith(".docx");
    
    if (!allowedTypes.includes(file.type) && !isValidByExtension) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. PDF, JPG, PNG, HWP, DOC, DOCX만 지원됩니다." },
        { status: 400 }
      );
    }

    // Save file to disk
    const documentId = uuidv4();
    console.log("[API Upload] Attempting to save file to disk...", {
      documentId,
      fileName: file.name,
      fileSize: file.size,
    });
    let savedFileName: string;
    try {
      savedFileName = await saveUploadedFile(file, documentId);
      console.log("[API Upload] File saved successfully:", savedFileName);
    } catch (saveError) {
      console.error("[API Upload] File save error:", {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        error: saveError instanceof Error ? saveError.message : String(saveError),
        stack: saveError instanceof Error ? saveError.stack : undefined,
      });
      throw new Error(`파일 저장 실패: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
    }

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
    console.error("[API Upload] ===== UPLOAD ERROR =====");
    console.error("[API Upload] Error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      isVercel: process.env.VERCEL === "1",
      nodeEnv: process.env.NODE_ENV,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    });
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    // Handle Admin SDK initialization errors
    if (error instanceof Error && (
      error.message.includes("not initialized") ||
      error.message.includes("Admin Firestore") ||
      error.message.includes("FIREBASE_SERVICE_ACCOUNT_KEY") ||
      error.message.includes("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
    )) {
      console.error("[API Upload] Admin SDK initialization error detected");
      return NextResponse.json(
        {
          error: "서버 설정 오류가 발생했습니다.",
          details: "Firebase Admin SDK가 초기화되지 않았습니다. 환경 변수를 확인하세요.",
          hint: process.env.VERCEL === "1" 
            ? "Vercel 환경 변수에서 FIREBASE_SERVICE_ACCOUNT_KEY와 NEXT_PUBLIC_FIREBASE_PROJECT_ID를 확인하세요."
            : "로컬 환경 변수에서 FIREBASE_SERVICE_ACCOUNT_KEY와 NEXT_PUBLIC_FIREBASE_PROJECT_ID를 확인하세요.",
        },
        { status: 500 }
      );
    }
    
    // Check for filesystem-related errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isFilesystemError = 
      errorMessage.includes("ENOENT") ||
      errorMessage.includes("EACCES") ||
      errorMessage.includes("EPERM") ||
      errorMessage.includes("파일 저장 실패") ||
      errorMessage.includes("Failed to create uploads directory");
    
    if (isFilesystemError) {
      console.error("[API Upload] Filesystem error detected - this may indicate Vercel filesystem issue");
      return NextResponse.json(
        {
          error: "파일 저장 중 오류가 발생했습니다.",
          details: "서버 파일 시스템에 문제가 있습니다.",
          hint: process.env.VERCEL === "1" 
            ? "Vercel에서는 /tmp 디렉토리만 쓰기 가능합니다. 파일 저장 경로를 확인하세요."
            : "파일 저장 디렉토리 권한을 확인하세요.",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: "파일 업로드 중 오류가 발생했습니다.",
        details: errorMessage,
        // Include more details in development, less in production for security
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          isVercel: process.env.VERCEL === "1",
        }),
      },
      { status: 500 }
    );
  }
}

