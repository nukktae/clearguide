import { PDFDocument } from "pdf-lib";
import { openai } from "@/src/lib/openai/client";
import { extractTextFromHWP, isHWPFile } from "./hwpExtractor";
import { extractTextFromDOCX, extractTextFromDOC, isDOCXFile, isDOCFile } from "./docxExtractor";

export interface OCRResult {
  text: string;
  confidence?: number;
  pageCount?: number;
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
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
 * Extract text using GPT-4o vision API
 * Supports images, PDFs, and as fallback for HWP/DOCX files
 */
export async function extractTextWithGPT4o(file: File): Promise<OCRResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // For HWP files, try native parsing first, then fallback to GPT-4o
  if (isHWPFile(file)) {
    try {
      console.log("[OCR] Attempting native HWP extraction for:", file.name);
      return await extractTextFromHWP(file);
    } catch (hwpError) {
      console.warn("[OCR] HWP native extraction failed, falling back to GPT-4o Vision:", hwpError);
      // Continue to GPT-4o Vision fallback below
    }
  }
  
  // For DOCX files, try native parsing first, then fallback to GPT-4o
  if (isDOCXFile(file)) {
    try {
      console.log("[OCR] Attempting native DOCX extraction for:", file.name);
      return await extractTextFromDOCX(file);
    } catch (docxError) {
      console.warn("[OCR] DOCX native extraction failed, falling back to GPT-4o Vision:", docxError);
      // Continue to GPT-4o Vision fallback below
    }
  }
  
  // For legacy DOC files, try native parsing first, then fallback to GPT-4o
  if (isDOCFile(file)) {
    try {
      console.log("[OCR] Attempting native DOC extraction for:", file.name);
      return await extractTextFromDOC(file);
    } catch (docError) {
      console.warn("[OCR] DOC native extraction failed, falling back to GPT-4o Vision:", docError);
      // Continue to GPT-4o Vision fallback below
    }
  }
  
  try {
    const base64 = await fileToBase64(file);
    
    // Determine MIME type for the data URL
    // For HWP/DOC/DOCX files that failed native parsing, treat as generic document
    let mimeType = fileType;
    if (!mimeType || mimeType === "application/octet-stream") {
      // Fallback MIME type detection based on extension
      if (fileName.endsWith(".hwp")) {
        mimeType = "application/vnd.hancom.hwp";
      } else if (fileName.endsWith(".docx")) {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (fileName.endsWith(".doc")) {
        mimeType = "application/msword";
      }
    }
    
    // For PDFs and images, GPT-4o can read them directly
    // For other formats, we send as-is and let GPT-4o try to interpret
    const imageUrl = `data:${mimeType};base64,${base64}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR (Optical Character Recognition) system. Your only job is to extract and return all visible text from images and documents. Return the text exactly as it appears, preserving spacing and line breaks. Do not refuse, do not add explanations, just return the raw text content.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this document image. Return ONLY the raw text content exactly as it appears. Preserve line breaks, spacing, and formatting. Do not add any explanations, summaries, or commentary. If there is no text visible, return an empty string.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    let extractedText = response.choices[0]?.message?.content || "";
    
    // Check if GPT-4o refused to process
    if (!extractedText || 
        extractedText.toLowerCase().includes("i'm sorry") || 
        extractedText.toLowerCase().includes("i can't assist") ||
        extractedText.toLowerCase().includes("cannot") ||
        extractedText.toLowerCase().includes("unable")) {
      console.error("[OCR] GPT-4o refused to process image:", extractedText);
      throw new Error("GPT-4o가 이미지를 처리할 수 없습니다. 다른 이미지를 시도해주세요.");
    }

    // Determine page count for PDFs
    let pageCount: number | undefined;
    if (fileType === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        pageCount = pdfDoc.getPages().length;
      } catch {
        pageCount = 1; // Fallback
      }
    } else {
      pageCount = 1; // Images and other formats are treated as single page
    }

    return {
      text: extractedText,
      confidence: 0.95, // GPT-4o vision is highly accurate
      pageCount,
    };
  } catch (error) {
    console.error("[OCR] GPT-4o extraction error:", error);
    
    // Fallback to mock OCR if GPT-4o fails
    console.warn("[OCR] Falling back to mock OCR");
    return extractText(file);
  }
}

/**
 * Main OCR function that routes to appropriate handler
 * Defaults to GPT-4o OCR
 */
export async function extractText(file: File): Promise<OCRResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType === "application/pdf") {
    return extractTextFromPDF(file);
  } else if (fileType.startsWith("image/")) {
    return extractTextFromImage(file);
  } else if (isHWPFile(file)) {
    // For HWP files, return a mock result (actual extraction happens in extractTextWithGPT4o)
    return {
      text: `[HWP 파일 처리됨: ${file.name}]\n\nHWP 파일의 텍스트를 추출 중입니다.`,
      confidence: 0.8,
      pageCount: 1,
    };
  } else if (isDOCXFile(file) || isDOCFile(file)) {
    // For Word files, return a mock result (actual extraction happens in extractTextWithGPT4o)
    return {
      text: `[Word 파일 처리됨: ${file.name}]\n\nWord 파일의 텍스트를 추출 중입니다.`,
      confidence: 0.8,
      pageCount: 1,
    };
  } else {
    throw new Error(`지원하지 않는 파일 형식입니다: ${fileType || fileName}`);
  }
}

