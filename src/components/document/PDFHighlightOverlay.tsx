"use client";

import * as React from "react";
import { TextItem } from "@/src/lib/pdfjs/textExtractor";
import { cn } from "@/src/lib/utils/cn";

export interface Highlight {
  textItem: TextItem;
  type: "deadline" | "penalty" | "name" | "amount" | "keyInfo";
  text: string;
}

interface PDFHighlightOverlayProps {
  highlights: Highlight[];
  scale: number;
  pageNumber: number;
  viewportHeight: number;
  className?: string;
}

const highlightColors = {
  deadline: "rgba(59, 130, 246, 0.3)", // blue
  penalty: "rgba(239, 68, 68, 0.3)", // red
  name: "rgba(168, 85, 247, 0.3)", // purple
  amount: "rgba(245, 158, 11, 0.3)", // amber
  keyInfo: "rgba(34, 197, 94, 0.3)", // green
};

const highlightBorders = {
  deadline: "rgba(59, 130, 246, 0.5)",
  penalty: "rgba(239, 68, 68, 0.5)",
  name: "rgba(168, 85, 247, 0.5)",
  amount: "rgba(245, 158, 11, 0.5)",
  keyInfo: "rgba(34, 197, 94, 0.5)",
};

export function PDFHighlightOverlay({
  highlights,
  scale,
  pageNumber,
  viewportHeight,
  className,
}: PDFHighlightOverlayProps) {
  // Filter highlights for current page
  const pageHighlights = highlights.filter((h) => h.textItem.pageNumber === pageNumber);

  if (pageHighlights.length === 0) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {pageHighlights.map((highlight, index) => {
        const { textItem, type } = highlight;
        // PDF.js coordinates: Y is from bottom, we need to flip it
        // Scale coordinates by the current scale
        const x = textItem.x * scale;
        // Y coordinate in PDF.js is from bottom, flip it for top-based positioning
        const y = (viewportHeight - textItem.y) * scale;
        const width = textItem.width * scale;
        const height = textItem.height * scale;

        return (
          <div
            key={`${textItem.pageNumber}-${index}-${x}-${y}`}
            className="absolute pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: highlightColors[type],
              border: `1px solid ${highlightBorders[type]}`,
              borderRadius: "2px",
            }}
            title={highlight.text}
          />
        );
      })}
    </div>
  );
}

