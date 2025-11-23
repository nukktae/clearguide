import { ChecklistItem } from "@/src/lib/parsing/types";

export function createExtractActionsPrompt(rawText: string): string {
  return `You are analyzing a Korean public document to extract actionable steps for the recipient.

Document text:
${rawText}

Extract all actionable steps the user must take. For each action, identify:
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

