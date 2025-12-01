import { ChecklistItem } from "@/src/lib/parsing/types";

export function createExtractActionsPrompt(rawText: string): string {
  return `You are ClearGuide AI, designed to solve the problem that people struggle to understand public/government documents.

**The Problem:** People struggle with complex public documents, leading to confusion, mistakes, and missed deadlines.

**Your Purpose:** Reduce confusion, prevent mistakes, and improve clarity by providing clear action items.

**The Goal:** Reduce citizen confusion and reduce call center load by making it crystal clear what actions are needed.

**Social Impact:** Bridge information gaps and improve accessibility.

You are analyzing a Korean public document to extract actionable steps for the recipient. Your goal is to provide clear, unambiguous guidance on what to do, where to go, and by when - reducing confusion and preventing mistakes.

Document text:
${rawText}

**IMPORTANT INSTRUCTIONS:**
1. Extract ALL actionable steps the user must take, even implicit ones.
2. If the document mentions dates, deadlines, or time periods, create an action for them.
3. If the document mentions places, phone numbers, or websites, create an action to visit/call/access them.
4. If the document mentions payments, fees, or amounts, create a payment action.
5. If the document is a cover page or title page, look for any indication of what the main document requires.
6. Even informational documents often require the user to "keep this document" or "refer to attached documents" - include these as actions.
7. If truly no actions exist, return an empty array [].

For each action, identify:
- What they need to do (title)
- When (deadline if mentioned)
- Where (location: online, offline office, phone, mail)
- Website URL (if online action and URL is mentioned in document, e.g., www.giro.or.kr)
- Bank account information (if payment is required: 예금주, 은행명, 계좌번호, 지로번호)
- What documents/items they need to bring
- Any additional notes

Return a JSON array of actions:
[
  {
    "id": "unique-id-1",
    "title": "짧은 행동 이름 (e.g., '온라인 신청하기')",
    "description": "optional detailed description",
    "deadline": "YYYY-MM-DD or null",
    "locationType": "online" | "offline" | "phone" | "mail" | null,
    "locationName": "specific location name if offline",
    "websiteUrl": "https://www.example.com (if online action and URL is mentioned)",
    "requiredDocs": ["필요한 서류 1", "필요한 서류 2"],
    "notes": "optional additional notes",
    "bankAccount": {
      "accountHolder": "예금주명 (if mentioned)",
      "bankName": "은행명 (if mentioned)",
      "accountNumber": "계좌번호 (if mentioned)",
      "giroNumber": "지로번호 (if mentioned)"
    }
  },
  ...
]

Focus on concrete, actionable steps. Order them chronologically if there's a sequence.`;
}

export async function parseActionsResponse(
  response: string
): Promise<ChecklistItem[]> {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any, index: number) => {
        const checklistItem: ChecklistItem = {
          id: item.id || `action-${index}`,
          title: item.title || "액션 항목",
          completed: false,
        };
        
        // Only add optional fields if they exist (don't set to undefined)
        if (item.description) {
          checklistItem.description = item.description;
        }
        if (item.deadline) {
          checklistItem.deadline = item.deadline;
        }
        if (item.locationType !== undefined && item.locationType !== null) {
          checklistItem.locationType = item.locationType;
        }
        if (item.locationName) {
          checklistItem.locationName = item.locationName;
        }
        if (item.websiteUrl) {
          checklistItem.websiteUrl = item.websiteUrl;
        }
        if (item.requiredDocs && Array.isArray(item.requiredDocs) && item.requiredDocs.length > 0) {
          checklistItem.requiredDocs = item.requiredDocs;
        }
        if (item.notes) {
          checklistItem.notes = item.notes;
        }
        if (item.bankAccount && Object.keys(item.bankAccount).length > 0) {
          checklistItem.bankAccount = {};
          if (item.bankAccount.accountHolder) {
            checklistItem.bankAccount.accountHolder = item.bankAccount.accountHolder;
          }
          if (item.bankAccount.bankName) {
            checklistItem.bankAccount.bankName = item.bankAccount.bankName;
          }
          if (item.bankAccount.accountNumber) {
            checklistItem.bankAccount.accountNumber = item.bankAccount.accountNumber;
          }
          if (item.bankAccount.giroNumber) {
            checklistItem.bankAccount.giroNumber = item.bankAccount.giroNumber;
          }
        }
        
        return checklistItem;
      });
    }
  } catch (error) {
    console.error("Error parsing actions response:", error);
  }

  return [];
}

