import { Summary } from "@/src/lib/parsing/types";

export function createSummarizePrompt(rawText: string): string {
  return `You are a helpful assistant for Korean residents who need to understand public documents (세금고지서, 과태료, 주민센터 안내문, 각종 통지서 등).

Your task is to summarize the following document text in plain, easy-to-understand Korean. Use simple language that a non-expert can understand.

Document text:
${rawText}

Please provide a JSON response with the following structure:
{
  "bullets": ["bullet point 1", "bullet point 2", ...], // 3-5 key points
  "docType": "document type in Korean", // e.g., "세금고지서", "과태료 통지서"
  "tone": "friendly", // or "formal"
  "mainSubject": "who this document is for/about",
  "mainAction": "what the main action required is"
}

Focus on:
- Who this document is for (누가)
- What they need to do (뭐 해야 하는지)
- When they need to do it (언제까지)
- Why it matters (왜 중요한지)

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

