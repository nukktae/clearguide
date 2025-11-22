export type DocumentCategory = "tax" | "community" | "penalty" | "default";

export interface DocumentTheme {
  category: DocumentCategory;
  bgColor: string;
  borderColor: string;
  accentColor: string;
}

/**
 * Determine document category from docType string
 */
export function getDocumentCategory(docType: string): DocumentCategory {
  const lowerDocType = docType.toLowerCase();
  
  // Tax documents
  if (
    lowerDocType.includes("세금") ||
    lowerDocType.includes("tax") ||
    lowerDocType.includes("납세") ||
    lowerDocType.includes("고지서") && lowerDocType.includes("세")
  ) {
    return "tax";
  }
  
  // Community center documents
  if (
    lowerDocType.includes("주민센터") ||
    lowerDocType.includes("동주민센터") ||
    lowerDocType.includes("구청") ||
    lowerDocType.includes("시청") ||
    lowerDocType.includes("안내문") ||
    lowerDocType.includes("공지")
  ) {
    return "community";
  }
  
  // Penalty notices
  if (
    lowerDocType.includes("과태료") ||
    lowerDocType.includes("penalty") ||
    lowerDocType.includes("벌금") ||
    lowerDocType.includes("통지서") && (lowerDocType.includes("과") || lowerDocType.includes("벌"))
  ) {
    return "penalty";
  }
  
  return "default";
}

/**
 * Get theme colors for document category
 */
export function getDocumentTheme(category: DocumentCategory): DocumentTheme {
  switch (category) {
    case "tax":
      return {
        category: "tax",
        bgColor: "bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20", // Soft amber tint
        borderColor: "border-amber-200/30",
        accentColor: "#F59E0B", // Amber-500
      };
    case "community":
      return {
        category: "community",
        bgColor: "bg-gradient-to-br from-teal-50/40 via-white to-teal-50/20", // Soft mint/teal tint
        borderColor: "border-teal-200/30",
        accentColor: "#2DB7A3", // Teal
      };
    case "penalty":
      return {
        category: "penalty",
        bgColor: "bg-gradient-to-br from-orange-50/40 via-white to-orange-50/20", // Soft danger orange tint
        borderColor: "border-orange-200/30",
        accentColor: "#F97316", // Orange-500
      };
    default:
      return {
        category: "default",
        bgColor: "bg-gradient-to-br from-gray-50/20 via-white to-white", // Neutral gray tint
        borderColor: "border-gray-200/30",
        accentColor: "#6B7280", // Gray-500
      };
  }
}

/**
 * Get document theme from docType string
 */
export function getDocumentThemeFromDocType(docType: string): DocumentTheme {
  const category = getDocumentCategory(docType);
  return getDocumentTheme(category);
}

