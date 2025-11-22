import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/src/lib/parsing/documentParser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, rawText } = body;

    if (!documentId || !rawText) {
      return NextResponse.json(
        { error: "documentId와 rawText가 필요합니다." },
        { status: 400 }
      );
    }

    const parsedDocument = await parseDocument(rawText, documentId);

    return NextResponse.json({
      success: true,
      parsedDocument,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error: "문서 분석 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

