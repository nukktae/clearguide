import { NextRequest, NextResponse } from "next/server";
import {
  getAllDocuments,
  saveDocument,
} from "@/src/lib/storage/documents";
import { DocumentRecord, ParsedDocument } from "@/src/lib/parsing/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const documents = await getAllDocuments();
    
    // Return documents sorted by upload date (newest first)
    const sorted = documents.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      documents: sorted,
      count: sorted.length,
    });
  } catch (error) {
    console.error("Get documents error:", error);
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
  try {
    const body = await request.json();
    const { document, parsedDocument } = body;

    if (!document) {
      return NextResponse.json(
        { error: "document 객체가 필요합니다." },
        { status: 400 }
      );
    }

    const documentRecord: DocumentRecord = {
      ...document,
      parsed: parsedDocument as ParsedDocument | undefined,
    };

    const saved = await saveDocument(documentRecord);

    return NextResponse.json({
      success: true,
      document: saved,
    });
  } catch (error) {
    console.error("Save document error:", error);
    return NextResponse.json(
      {
        error: "문서 저장 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

