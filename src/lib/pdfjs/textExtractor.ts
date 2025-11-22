import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface PageText {
  pageNumber: number;
  items: TextItem[];
  fullText: string;
}

/**
 * Load PDF document from URL
 */
export async function loadPDFDocument(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    url,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });
  
  return await loadingTask.promise;
}

/**
 * Extract text with positions from a PDF page
 */
export async function extractTextFromPage(
  page: pdfjsLib.PDFPageProxy
): Promise<PageText> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  const items: TextItem[] = [];
  let fullText = "";
  
  for (const item of textContent.items) {
    if ("str" in item && item.str && item.str.trim()) {
      const transform = item.transform;
      // PDF.js transform matrix: [a, b, c, d, e, f]
      // e = x translation, f = y translation (from bottom-left origin)
      const x = transform[4];
      const y = transform[5]; // Keep original Y (from bottom)
      const width = item.width || 0;
      const height = item.height || 0;
      
      items.push({
        text: item.str,
        x,
        y, // Store Y from bottom, will flip in overlay
        width,
        height,
        pageNumber: page.pageNumber,
      });
      
      fullText += item.str + " ";
    }
  }
  
  return {
    pageNumber: page.pageNumber,
    items,
    fullText: fullText.trim(),
  };
}

/**
 * Extract text from all pages of a PDF
 */
export async function extractTextFromPDF(
  pdfDocument: pdfjsLib.PDFDocumentProxy
): Promise<PageText[]> {
  const numPages = pdfDocument.numPages;
  const pages: PageText[] = [];
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const pageText = await extractTextFromPage(page);
    pages.push(pageText);
  }
  
  return pages;
}

/**
 * Get text items within a bounding box (for highlighting)
 */
export function getTextItemsInBounds(
  items: TextItem[],
  bounds: { x: number; y: number; width: number; height: number }
): TextItem[] {
  return items.filter((item) => {
    return (
      item.x >= bounds.x &&
      item.x + item.width <= bounds.x + bounds.width &&
      item.y >= bounds.y &&
      item.y + item.height <= bounds.y + bounds.height
    );
  });
}

