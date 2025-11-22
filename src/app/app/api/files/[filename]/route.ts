import { NextRequest, NextResponse } from "next/server";
import { getFilePath, fileExists } from "@/src/lib/storage/files";
import { promises as fs } from "fs";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Check if file exists
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
    };
    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
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

