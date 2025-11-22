import { PDFDocument } from "pdf-lib";

export interface OCRResult {
  text: string;
  confidence?: number;
  pageCount?: number;
}

/**
 * Extract text from PDF using pdf-lib
 * Note: pdf-lib extracts text from PDFs that have selectable text.
 * For scanned PDFs or images, you would need a real OCR service.
 */
export async function extractTextFromPDF(file: File): Promise<OCRResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    // pdf-lib doesn't directly extract text, so we'll need to use a different approach
    // For MVP, we'll return a mock response indicating the PDF was processed
    // In production, you'd use pdfjs-dist or a real OCR service
    
    return {
      text: `[PDF 파일 처리됨: ${pages.length}페이지]\n\n이 PDF 파일의 텍스트를 추출하려면 실제 OCR 서비스가 필요합니다. MVP에서는 샘플 텍스트를 사용합니다.`,
      confidence: 0.8,
      pageCount: pages.length,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("PDF 처리 중 오류가 발생했습니다.");
  }
}

/**
 * Mock OCR for images
 * In production, integrate with Tesseract.js, Google Vision API, or similar
 */
export async function extractTextFromImage(file: File): Promise<OCRResult> {
  // Mock implementation for MVP
  return {
    text: `[이미지 파일 처리됨: ${file.name}]\n\n이미지에서 텍스트를 추출하려면 실제 OCR 서비스가 필요합니다. MVP에서는 샘플 텍스트를 사용합니다.\n\n예시 문서 내용:\n- 세금고지서 또는 과태료 통지서\n- 납부 기한: 2025년 1월 31일까지\n- 납부 장소: 온라인 또는 주민센터\n- 필요 서류: 신분증, 통지서`,
    confidence: 0.7,
  };
}

/**
 * Main OCR function that routes to appropriate handler
 */
export async function extractText(file: File): Promise<OCRResult> {
  const fileType = file.type;
  
  if (fileType === "application/pdf") {
    return extractTextFromPDF(file);
  } else if (fileType.startsWith("image/")) {
    return extractTextFromImage(file);
  } else {
    throw new Error(`지원하지 않는 파일 형식입니다: ${fileType}`);
  }
}

