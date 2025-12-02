import mammoth from "mammoth";
import type { OCRResult } from "./ocrClient";

/**
 * Extract text from DOCX files using mammoth
 * Falls back to GPT-4o Vision if parsing fails
 */
export async function extractTextFromDOCX(file: File): Promise<OCRResult> {
  try {
    console.log("[DOCX Extractor] Starting DOCX text extraction for:", file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to extract raw text
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const extractedText = result.value;
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn("[DOCX Extractor] Mammoth warnings:", result.messages);
    }
    
    // If no text was extracted, the file might be corrupted or image-based
    if (!extractedText.trim()) {
      console.warn("[DOCX Extractor] No text extracted from DOCX");
      throw new Error("DOCX 파일에서 텍스트를 추출할 수 없습니다. GPT-4o Vision으로 폴백합니다.");
    }
    
    console.log("[DOCX Extractor] Successfully extracted text, length:", extractedText.length);
    
    return {
      text: extractedText.trim(),
      confidence: 0.95,
      pageCount: 1, // mammoth doesn't provide page count
    };
  } catch (error) {
    console.error("[DOCX Extractor] Error extracting text from DOCX:", error);
    
    // Re-throw to trigger fallback to GPT-4o Vision in the calling function
    throw error;
  }
}

/**
 * Extract text from legacy DOC files using mammoth
 * Note: mammoth has limited support for .doc files
 * Falls back to GPT-4o Vision if parsing fails
 */
export async function extractTextFromDOC(file: File): Promise<OCRResult> {
  try {
    console.log("[DOC Extractor] Starting DOC text extraction for:", file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // mammoth can sometimes handle .doc files, but support is limited
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const extractedText = result.value;
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn("[DOC Extractor] Mammoth warnings:", result.messages);
    }
    
    // If no text was extracted, the file format might not be supported
    if (!extractedText.trim()) {
      console.warn("[DOC Extractor] No text extracted from DOC, format may not be fully supported");
      throw new Error("DOC 파일에서 텍스트를 추출할 수 없습니다. GPT-4o Vision으로 폴백합니다.");
    }
    
    console.log("[DOC Extractor] Successfully extracted text, length:", extractedText.length);
    
    return {
      text: extractedText.trim(),
      confidence: 0.85, // Lower confidence for .doc files
      pageCount: 1,
    };
  } catch (error) {
    console.error("[DOC Extractor] Error extracting text from DOC:", error);
    
    // Re-throw to trigger fallback to GPT-4o Vision in the calling function
    throw error;
  }
}

/**
 * Check if a file is a DOCX file based on MIME type or extension
 */
export function isDOCXFile(file: File): boolean {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  return (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  );
}

/**
 * Check if a file is a legacy DOC file based on MIME type or extension
 */
export function isDOCFile(file: File): boolean {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  return (
    fileType === "application/msword" ||
    (fileName.endsWith(".doc") && !fileName.endsWith(".docx"))
  );
}

/**
 * Check if a file is any Word document (DOC or DOCX)
 */
export function isWordFile(file: File): boolean {
  return isDOCFile(file) || isDOCXFile(file);
}

