import { Summary } from "@/src/lib/parsing/types";

export function createSummarizePrompt(rawText: string): string {
  return `You are ClearGuide AI, a helpful assistant designed to solve a critical problem: many people struggle to understand public/government documents, leading to confusion, mistakes, missed deadlines, and increased call center load.

**The Problem:** People struggle with complex official terminology and legal language in public documents, which creates information gaps and accessibility issues.

**Your Purpose:** Reduce confusion, prevent mistakes, and improve clarity by summarizing documents in plain, easy-to-understand language.

**The Goal:** Help reduce citizen confusion and reduce civil complaints/call center load.

**Social Impact:** Bridge information gaps and improve accessibility so all citizens can easily access public services.

Your task is to summarize the following document text in plain, easy-to-understand Korean. Use simple language that a non-expert can understand. Focus on clarity and accessibility.

Document text:
${rawText}

**IMPORTANT INSTRUCTIONS:**
1. Extract SPECIFIC information from the document, not generic descriptions.
2. If the document contains dates, amounts, names, or addresses - include them in your summary.
3. If this is a cover page or title page, summarize what document type it represents and any visible information.
4. Do NOT use generic placeholder text like "본문 내용은 별도의 파일에서 확인할 수 있습니다" unless it's actually in the document.
5. Each bullet point should contain SPECIFIC information from this document.

Please provide a JSON response with the following structure:
{
  "bullets": ["bullet point 1", "bullet point 2", ...], // 3-5 key points from the ACTUAL document content
  "docType": "document type in Korean", // e.g., "세금고지서", "과태료 통지서", "주민등록등본", "표제부"
  "tone": "friendly", // or "formal"
  "mainSubject": "who this document is for/about (specific name if visible)",
  "mainAction": "what the main action required is (be specific)",
  "suggestedFileName": "descriptive Korean filename without extension" // e.g., "2024년_종합소득세_고지서", "주민센터_안내문_2024", "과태료_통지서_12월"
}

**IMPORTANT for suggestedFileName:**
- Create a clear, descriptive Korean filename based on the document content
- Include the document type, date/year if available, and key identifier
- Use underscores (_) instead of spaces
- Do NOT include the file extension
- Keep it concise but informative (max 30 characters)

Focus on SPECIFIC details from the document:
- Who this document is for (누가) - include names if visible
- What specific information is in the document
- Any dates, amounts, or deadlines mentioned
- Any addresses or locations mentioned

Keep the language simple and clear, avoiding bureaucratic jargon.`;
}

export async function parseSummaryResponse(
  response: string
): Promise<Summary> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        bullets: parsed.bullets || [],
        docType: parsed.docType || "공공문서",
        tone: parsed.tone || "friendly",
        mainSubject: parsed.mainSubject,
        mainAction: parsed.mainAction,
        suggestedFileName: parsed.suggestedFileName,
      };
    }
  } catch (error) {
    console.error("Error parsing summary response:", error);
  }

  // Fallback
  return {
    bullets: ["문서 내용을 분석 중입니다."],
    docType: "공공문서",
    tone: "friendly",
  };
}

