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
import { ParsedDocument, Summary, ChecklistItem, RiskAlert } from "./types";
import { extractUrls, extractBankAccountInfo } from "@/src/lib/utils/textExtraction";

/**
 * Extract summary from document text
 * 
 * Purpose: Reduce confusion by summarizing complex documents in plain, easy-to-understand language
 * Goal: Reduce citizen confusion and prevent mistakes
 * Social Impact: Bridge information gaps and improve accessibility
 */
export async function extractSummary(rawText: string): Promise<Summary> {
  try {
    console.log("[extractSummary] Starting summary extraction");
    console.log("[extractSummary] Input text length:", rawText.length);
    console.log("[extractSummary] Input text preview (first 500 chars):", rawText.substring(0, 500));
    
    const summaryPrompt = createSummarizePrompt(rawText);
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
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
    console.log("[extractSummary] AI response:", summaryText);
    
    const summary = await parseSummaryResponse(summaryText);
    console.log("[extractSummary] Parsed summary:", {
      bulletsCount: summary.bullets.length,
      docType: summary.docType,
      bullets: summary.bullets,
    });
    return summary;
  } catch (error) {
    console.error("Error extracting summary:", error);
    throw new Error("요약 생성 중 오류가 발생했습니다.");
  }
}

/**
 * Extract actionable steps from document text
 * 
 * Purpose: Provide clear action items (what to do, where to go, by when) to reduce confusion
 * Goal: Reduce citizen confusion and prevent missed deadlines
 * Social Impact: Improve accessibility by making required actions crystal clear
 */
export async function extractChecklist(rawText: string): Promise<ChecklistItem[]> {
  try {
    console.log("[extractChecklist] Starting checklist extraction");
    console.log("[extractChecklist] Input text length:", rawText.length);
    console.log("[extractChecklist] Input text preview (first 500 chars):", rawText.substring(0, 500));
    
    const actionsPrompt = createExtractActionsPrompt(rawText);
    const actionsResponse = await openai.chat.completions.create({
      model: "gpt-4o",
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
    console.log("[extractChecklist] Raw AI response length:", actionsText.length);
    console.log("[extractChecklist] Raw AI response:", actionsText);
    
    let actions = await parseActionsResponse(actionsText);
    console.log("[extractChecklist] Parsed actions count:", actions.length);
    
    if (actions.length === 0) {
      console.warn("[extractChecklist] No actions extracted! Raw response:", actionsText);
    }
    
    // Enhance actions with extracted URLs and bank account info from raw text
    const urls = extractUrls(rawText);
    const bankInfo = extractBankAccountInfo(rawText);
    
    console.log("[extractChecklist] Extracted URLs:", urls.length, "Bank info:", !!bankInfo.accountHolder);
    
    // Add URLs and bank info to actions that need them
    actions = actions.map(action => {
      // If online action and has no websiteUrl, try to find URL from extracted URLs
      if (action.locationType === "online" && !action.websiteUrl && urls.length > 0) {
        action.websiteUrl = urls[0]; // Use first URL found
        console.log("[extractChecklist] Added websiteUrl to action:", action.id);
      }
      
      // If online action and has no bankAccount, add extracted bank info
      if (action.locationType === "online" && !action.bankAccount && 
          (bankInfo.accountHolder || bankInfo.bankName || bankInfo.accountNumber || bankInfo.giroNumber)) {
        action.bankAccount = bankInfo;
        console.log("[extractChecklist] Added bankAccount to action:", action.id);
      }
      
      return action;
    });
    
    console.log("[extractChecklist] Final actions count:", actions.length);
    return actions;
  } catch (error) {
    console.error("[extractChecklist] Error extracting checklist:", error);
    throw new Error("체크리스트 생성 중 오류가 발생했습니다.");
  }
}

/**
 * Extract risks, penalties, and deadlines from document text
 * 
 * Purpose: Identify critical information (penalties, deadlines, warnings) to prevent mistakes
 * Goal: Reduce citizen confusion and reduce call center load by proactively alerting users
 * Social Impact: Prevent missed deadlines and benefit cancellations
 */
export async function extractRisks(rawText: string): Promise<RiskAlert[]> {
  try {
    const risksPrompt = createExtractRisksPrompt(rawText);
    const risksResponse = await openai.chat.completions.create({
      model: "gpt-4o",
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
    return risks;
  } catch (error) {
    console.error("Error extracting risks:", error);
    throw new Error("위험 알림 생성 중 오류가 발생했습니다.");
  }
}

export async function parseDocument(
  rawText: string,
  documentId: string
): Promise<ParsedDocument> {
  try {
    // Call OpenAI for summary
    const summaryPrompt = createSummarizePrompt(rawText);
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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

