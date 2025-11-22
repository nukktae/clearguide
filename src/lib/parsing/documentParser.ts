import { openai } from "@/src/lib/openai/client";
import {
  createSummarizePrompt,
  parseSummaryResponse,
} from "@/src/lib/openai/prompts/summarizeDocument";
import {
  createExtractActionsPrompt,
  parseActionsResponse,
} from "@/src/lib/openai/prompts/extractActions";
import {
  createExtractRisksPrompt,
  parseRisksResponse,
} from "@/src/lib/openai/prompts/extractRisks";
import { ParsedDocument } from "./types";

export async function parseDocument(
  rawText: string,
  documentId: string
): Promise<ParsedDocument> {
  try {
    // Call OpenAI for summary
    const summaryPrompt = createSummarizePrompt(rawText);
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for Korean residents. Always respond with valid JSON.",
        },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.3,
    });

    const summaryText =
      summaryResponse.choices[0]?.message?.content || "{}";
    const summary = await parseSummaryResponse(summaryText);

    // Call OpenAI for actions
    const actionsPrompt = createExtractActionsPrompt(rawText);
    const actionsResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for Korean residents. Always respond with valid JSON arrays.",
        },
        { role: "user", content: actionsPrompt },
      ],
      temperature: 0.3,
    });

    const actionsText = actionsResponse.choices[0]?.message?.content || "[]";
    const actions = await parseActionsResponse(actionsText);

    // Call OpenAI for risks
    const risksPrompt = createExtractRisksPrompt(rawText);
    const risksResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for Korean residents. Always respond with valid JSON arrays.",
        },
        { role: "user", content: risksPrompt },
      ],
      temperature: 0.3,
    });

    const risksText = risksResponse.choices[0]?.message?.content || "[]";
    const risks = await parseRisksResponse(risksText);

    return {
      documentId,
      summary,
      actions,
      risks,
      meta: {
        parsedAt: new Date().toISOString(),
        confidence: 0.85,
        language: "ko",
      },
    };
  } catch (error) {
    console.error("Error parsing document:", error);
    throw new Error("문서 분석 중 오류가 발생했습니다.");
  }
}

