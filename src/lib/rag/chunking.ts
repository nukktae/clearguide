/**
 * Document chunking utilities for RAG system
 * Splits OCR text into overlapping chunks with metadata
 */

export interface ChunkMetadata {
  chunkIndex: number;
  startChar: number;
  endChar: number;
  pageNumber?: number;
  fileName?: string;
}

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkingOptions {
  chunkSize?: number;      // Target chunk size in characters (default: 500)
  chunkOverlap?: number;   // Overlap between chunks (default: 100)
  fileName?: string;       // Original file name for metadata
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 100;

/**
 * Split text into chunks with overlapping boundaries
 * Attempts to preserve sentence boundaries when possible
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    fileName,
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean and normalize text
  const normalizedText = normalizeText(text);
  
  if (normalizedText.length <= chunkSize) {
    // Text is small enough to fit in one chunk
    return [{
      text: normalizedText,
      metadata: {
        chunkIndex: 0,
        startChar: 0,
        endChar: normalizedText.length,
        fileName,
      },
    }];
  }

  const chunks: TextChunk[] = [];
  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < normalizedText.length) {
    // Calculate end position
    let endPos = Math.min(startPos + chunkSize, normalizedText.length);

    // Try to find a sentence boundary near the end position
    if (endPos < normalizedText.length) {
      endPos = findSentenceBoundary(normalizedText, startPos, endPos, chunkSize);
    }

    // Extract the chunk text
    const chunkText = normalizedText.slice(startPos, endPos).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        metadata: {
          chunkIndex,
          startChar: startPos,
          endChar: endPos,
          fileName,
        },
      });
      chunkIndex++;
    }

    // Move to next chunk with overlap
    // If we're at the end, break
    if (endPos >= normalizedText.length) {
      break;
    }

    // Calculate next start position with overlap
    startPos = Math.max(endPos - chunkOverlap, startPos + 1);
  }

  return chunks;
}

/**
 * Normalize text by cleaning up whitespace and formatting
 */
function normalizeText(text: string): string {
  return text
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, "\n\n")
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, " ")
    // Trim each line
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Find a sentence boundary near the target end position
 * Looks for periods, question marks, exclamation marks, or Korean sentence endings
 */
function findSentenceBoundary(
  text: string,
  startPos: number,
  targetEndPos: number,
  maxChunkSize: number
): number {
  // Define sentence ending patterns (including Korean)
  const sentenceEndings = /[.!?。？！]\s|[다요죠]\s/g;
  
  // Search within a window around the target position
  const searchStart = Math.max(startPos, targetEndPos - 100);
  const searchEnd = Math.min(text.length, targetEndPos + 50);
  const searchText = text.slice(searchStart, searchEnd);

  let lastEndingPos = -1;
  let match;

  // Find all sentence endings in the search window
  while ((match = sentenceEndings.exec(searchText)) !== null) {
    const absolutePos = searchStart + match.index + match[0].length;
    
    // Only consider endings that keep chunk size reasonable
    if (absolutePos - startPos <= maxChunkSize + 50 && absolutePos - startPos >= maxChunkSize - 100) {
      lastEndingPos = absolutePos;
    }
  }

  // If we found a good sentence boundary, use it
  if (lastEndingPos > startPos) {
    return lastEndingPos;
  }

  // Fallback: try to break at a paragraph boundary
  const paragraphBreak = text.indexOf("\n\n", targetEndPos - 50);
  if (paragraphBreak !== -1 && paragraphBreak - startPos <= maxChunkSize + 50) {
    return paragraphBreak + 2; // Include the newlines
  }

  // Fallback: try to break at a word boundary
  const spacePos = text.lastIndexOf(" ", targetEndPos);
  if (spacePos > startPos && spacePos > targetEndPos - 50) {
    return spacePos + 1;
  }

  // Last resort: just use the target position
  return targetEndPos;
}

/**
 * Chunk text with page number detection
 * Attempts to detect page markers in the text (e.g., "페이지 1", "Page 1", "- 1 -")
 */
export function chunkTextWithPages(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  // Split text by page markers
  const pagePattern = /(?:페이지\s*(\d+)|Page\s*(\d+)|[-─]\s*(\d+)\s*[-─])/gi;
  
  let currentPage = 1;
  const pageMarkers: { index: number; page: number }[] = [];
  let match;

  while ((match = pagePattern.exec(text)) !== null) {
    const pageNum = parseInt(match[1] || match[2] || match[3], 10);
    if (!isNaN(pageNum)) {
      pageMarkers.push({ index: match.index, page: pageNum });
    }
  }

  // If no page markers found, chunk without page info
  if (pageMarkers.length === 0) {
    return chunkText(text, options);
  }

  // Chunk the text
  const chunks = chunkText(text, options);

  // Assign page numbers to chunks based on their position
  return chunks.map(chunk => {
    // Find the page number for this chunk's position
    let pageNumber = 1;
    for (const marker of pageMarkers) {
      if (marker.index <= chunk.metadata.startChar) {
        pageNumber = marker.page;
      } else {
        break;
      }
    }

    return {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        pageNumber,
      },
    };
  });
}

/**
 * Calculate optimal chunk parameters based on document length
 */
export function getOptimalChunkParams(textLength: number): {
  chunkSize: number;
  chunkOverlap: number;
} {
  if (textLength < 1000) {
    // Very short document - use smaller chunks
    return { chunkSize: 300, chunkOverlap: 50 };
  } else if (textLength < 5000) {
    // Short document
    return { chunkSize: 400, chunkOverlap: 80 };
  } else if (textLength < 20000) {
    // Medium document
    return { chunkSize: 500, chunkOverlap: 100 };
  } else {
    // Long document - use larger chunks
    return { chunkSize: 600, chunkOverlap: 120 };
  }
}

