import { NextRequest, NextResponse } from "next/server";
import { getFilePath, fileExists } from "@/src/lib/storage/files";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getDocumentByFilePath } from "@/src/lib/firebase/firestore-documents";
import { promises as fs } from "fs";

export const runtime = "nodejs";

/**
 * GET /app/api/files/[filename]
 * Serve uploaded files with authentication and ownership verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    const { filename } = await params;

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Verify file ownership by checking if document exists for this user
    const document = await getDocumentByFilePath(filename, userId);
    if (!document) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // Check if file exists on disk
    if (!(await fileExists(filename))) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read file
    const filePath = getFilePath(filename);
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      hwp: "application/vnd.hancom.hwp",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${document.fileName || filename}"`,
        "Cache-Control": "private, max-age=3600", // Changed to private since files are user-specific
      },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    console.error("File serve error:", error);
    return NextResponse.json(
      {
        error: "파일을 불러오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

