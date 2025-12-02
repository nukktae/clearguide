import type { OCRResult } from "./ocrClient";

/**
 * Extract text from HWP (Hancom) files using hwp.js
 * Falls back to GPT-4o Vision if parsing fails
 */
export async function extractTextFromHWP(file: File): Promise<OCRResult> {
  try {
    console.log("[HWP Extractor] Starting HWP text extraction for:", file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamic import of hwp.js (ESM module)
    const HWPDocument = (await import("hwp.js")).default;
    
    // Parse the HWP file
    const hwpDoc = new HWPDocument(arrayBuffer);
    
    // Extract text from all sections
    let extractedText = "";
    
    // hwp.js provides text through sections and paragraphs
    if (hwpDoc.sections) {
      for (const section of hwpDoc.sections) {
        if (section.paragraphs) {
          for (const paragraph of section.paragraphs) {
            if (paragraph.text) {
              extractedText += paragraph.text + "\n";
            }
          }
        }
      }
    }
    
    // If no text was extracted, the file might be image-based or encrypted
    if (!extractedText.trim()) {
      console.warn("[HWP Extractor] No text extracted from HWP, might be image-based or encrypted");
      throw new Error("HWP 파일에서 텍스트를 추출할 수 없습니다. GPT-4o Vision으로 폴백합니다.");
    }
    
    console.log("[HWP Extractor] Successfully extracted text, length:", extractedText.length);
    
    return {
      text: extractedText.trim(),
      confidence: 0.9,
      pageCount: hwpDoc.sections?.length || 1,
    };
  } catch (error) {
    console.error("[HWP Extractor] Error extracting text from HWP:", error);
    
    // Re-throw to trigger fallback to GPT-4o Vision in the calling function
    throw error;
  }
}

/**
 * Check if a file is an HWP file based on MIME type or extension
 */
export function isHWPFile(file: File): boolean {
  const hwpMimeTypes = [
    "application/vnd.hancom.hwp",
    "application/x-hwp",
    "application/haansofthwp",
  ];
  
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  return hwpMimeTypes.includes(fileType) || fileName.endsWith(".hwp");
}

