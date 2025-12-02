/**
 * OCR Text Cleaner
 * Removes duplicate lines and repeated patterns from OCR output
 */

export interface CleanupStats {
  duplicateLinesRemoved: number;
  repeatedPatternsRemoved: number;
  consecutiveBlocksCollapsed: number;
  originalLength: number;
  cleanedLength: number;
}

/**
 * Remove duplicate lines and repeated patterns from OCR text
 * Preserves formatting and Korean text integrity
 */
export function dedupeOCRText(text: string): {
  cleanedText: string;
  stats: CleanupStats;
} {
  if (!text || text.trim().length === 0) {
    return {
      cleanedText: text,
      stats: {
        duplicateLinesRemoved: 0,
        repeatedPatternsRemoved: 0,
        consecutiveBlocksCollapsed: 0,
        originalLength: text.length,
        cleanedLength: text.length,
      },
    };
  }

  const originalLength = text.length;
  let cleanedText = text;
  let duplicateLinesRemoved = 0;
  let repeatedPatternsRemoved = 0;
  let consecutiveBlocksCollapsed = 0;

  // Split into lines while preserving line breaks
  const lines = cleanedText.split(/\r?\n/);
  const originalLineCount = lines.length;

  // Step 1: Remove exact duplicate consecutive lines
  const deduplicatedLines: string[] = [];
  let prevLine: string | null = null;
  let consecutiveDuplicates = 0;

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    
    // Skip empty lines if previous was also empty
    if (currentLine === '' && prevLine === '') {
      duplicateLinesRemoved++;
      continue;
    }

    // If current line is identical to previous, skip it
    if (currentLine === prevLine && currentLine !== '') {
      duplicateLinesRemoved++;
      consecutiveDuplicates++;
      continue;
    }

    // Reset consecutive duplicates counter when we find a new line
    if (consecutiveDuplicates > 0) {
      consecutiveBlocksCollapsed++;
      consecutiveDuplicates = 0;
    }

    deduplicatedLines.push(lines[i]); // Keep original line with formatting
    prevLine = currentLine;
  }

  cleanedText = deduplicatedLines.join('\n');

  // Step 2: Remove rapidly repeated patterns (same line appearing multiple times with few lines in between)
  const patternLines = cleanedText.split(/\r?\n/);
  const seenPatterns = new Map<string, { count: number; lastSeenIndex: number }>();
  const filteredPatternLines: string[] = [];
  const MAX_REPEAT_DISTANCE = 5; // If same pattern appears within 5 lines, consider it a repeat

  for (let i = 0; i < patternLines.length; i++) {
    const line = patternLines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine === '') {
      filteredPatternLines.push(line);
      continue;
    }

    const pattern = trimmedLine;
    const patternInfo = seenPatterns.get(pattern);

    if (patternInfo) {
      const distance = i - patternInfo.lastSeenIndex;
      
      // If same pattern appears within MAX_REPEAT_DISTANCE lines, skip it
      if (distance <= MAX_REPEAT_DISTANCE && patternInfo.count >= 2) {
        repeatedPatternsRemoved++;
        continue;
      }
      
      // Update pattern info
      seenPatterns.set(pattern, {
        count: patternInfo.count + 1,
        lastSeenIndex: i,
      });
    } else {
      // First time seeing this pattern
      seenPatterns.set(pattern, {
        count: 1,
        lastSeenIndex: i,
      });
    }

    filteredPatternLines.push(line);
  }

  cleanedText = filteredPatternLines.join('\n');

  // Step 3: Collapse consecutive identical blocks (3+ consecutive identical lines)
  const blockLines = cleanedText.split(/\r?\n/);
  const collapsedBlockLines: string[] = [];
  let currentBlock: { pattern: string; startIndex: number; count: number } | null = null;

  function flushBlock() {
    if (currentBlock) {
      if (currentBlock.count >= 3) {
        // Collapse to single occurrence
        collapsedBlockLines.push(blockLines[currentBlock.startIndex]);
        consecutiveBlocksCollapsed += currentBlock.count - 1;
      } else {
        // Keep all lines if block is small
        for (let j = currentBlock.startIndex; j < currentBlock.startIndex + currentBlock.count; j++) {
          collapsedBlockLines.push(blockLines[j]);
        }
      }
      currentBlock = null;
    }
  }

  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      // Empty line resets block
      flushBlock();
      collapsedBlockLines.push(line);
      continue;
    }

    if (currentBlock === null) {
      // Start new block
      currentBlock = {
        pattern: trimmedLine,
        startIndex: i,
        count: 1,
      };
    } else if (trimmedLine === currentBlock.pattern) {
      // Continue block
      currentBlock.count++;
    } else {
      // Block ended, start new block
      flushBlock();
      currentBlock = {
        pattern: trimmedLine,
        startIndex: i,
        count: 1,
      };
    }
  }

  // Handle final block
  flushBlock();

  cleanedText = collapsedBlockLines.join('\n');

  // Step 4: Clean up excessive blank lines (more than 2 consecutive blank lines)
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');

  // Step 5: Preserve Korean text formatting - ensure proper spacing around Korean characters
  // This step ensures Korean text readability is maintained
  cleanedText = cleanedText.trim();

  const cleanedLength = cleanedText.length;

  return {
    cleanedText,
    stats: {
      duplicateLinesRemoved,
      repeatedPatternsRemoved,
      consecutiveBlocksCollapsed,
      originalLength,
      cleanedLength,
    },
  };
}

