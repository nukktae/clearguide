import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/src/lib/ocr/ocrClient";
import { v4 as uuidv4 } from "uuid";
import { saveUploadedFile } from "@/src/lib/storage/files";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 10MB를 초과할 수 없습니다." },
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

    // Extract text using OCR
    const ocrResult = await extractText(file);

    // Create document record
    const document = {
      id: documentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      rawText: ocrResult.text,
      filePath: savedFileName,
    };

    return NextResponse.json({
      documentId,
      document,
      ocrResult: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "파일 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

