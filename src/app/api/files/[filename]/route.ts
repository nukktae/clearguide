import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getDocumentByFilePath } from "@/src/lib/firebase/firestore-documents";
import { supabase } from "@/src/lib/supabase/client";

export const runtime = "nodejs";

// Supabase Storage bucket name for document files
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "clearguide-files";

/**
 * GET /api/files/[filename]
 * Serve uploaded files from Supabase Storage with authentication and ownership verification
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

    // Check if Supabase is configured
    if (!supabase) {
      console.error("[API Files] Supabase not configured");
      return NextResponse.json(
        { error: "Storage service not configured" },
        { status: 500 }
      );
    }

    // Download file from Supabase Storage
    console.log("[API Files] Downloading from Supabase:", {
      bucket: SUPABASE_BUCKET_NAME,
      filename,
      userId,
    });

    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .download(filename);

    if (error || !data) {
      console.error("[API Files] Supabase download error:", {
        error: error?.message,
        filename,
        bucket: SUPABASE_BUCKET_NAME,
      });
      return NextResponse.json(
        { error: "File not found", details: error?.message },
        { status: 404 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

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
    // Encode filename for Content-Disposition header (handles Korean characters)
    const encodedFileName = encodeURIComponent(document.fileName || filename);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
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
    
    console.error("[API Files] File serve error:", error);
    return NextResponse.json(
      {
        error: "파일을 불러오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

