import { ChecklistItem } from "@/src/lib/parsing/types";

export function createExtractActionsPrompt(rawText: string): string {
  return `You are analyzing a Korean public document to extract actionable steps for the recipient.

Document text:
${rawText}

Extract all actionable steps the user must take. For each action, identify:
- What they need to do (title)
- When (deadline if mentioned)
- Where (location: online, offline office, phone, mail)
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
    "requiredDocs": ["필요한 서류 1", "필요한 서류 2"],
    "notes": "optional additional notes"
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
      return parsed.map((item: any, index: number) => ({
        id: item.id || `action-${index}`,
        title: item.title || "액션 항목",
        description: item.description,
        deadline: item.deadline || undefined,
        locationType: item.locationType || null,
        locationName: item.locationName,
        requiredDocs: item.requiredDocs || [],
        notes: item.notes,
        completed: false,
      }));
    }
  } catch (error) {
    console.error("Error parsing actions response:", error);
  }

  return [];
}

