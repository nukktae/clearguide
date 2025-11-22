import { RiskAlert } from "@/src/lib/parsing/types";

export function createExtractRisksPrompt(rawText: string): string {
  return `You are analyzing a Korean public document to identify risks, penalties, deadlines, and important warnings.

Document text:
${rawText}

Identify any:
- Penalties (과태료) and their amounts
- Benefit cancellations (혜택 취소)
- Eligibility loss (자격 상실)
- Critical deadlines
- Other important warnings

Return a JSON array of risks:
[
  {
    "id": "unique-id-1",
    "type": "penalty" | "benefitCancellation" | "eligibilityLoss" | "deadline" | "other",
    "severity": "low" | "medium" | "high" | "critical",
    "title": "short title in Korean",
    "message": "clear explanation of the risk",
    "deadline": "YYYY-MM-DD or null",
    "amount": "penalty amount if applicable",
    "conditions": ["condition 1", "condition 2"]
  },
  ...
]

Be thorough but prioritize critical risks. Use clear, direct language.`;
}

export async function parseRisksResponse(response: string): Promise<RiskAlert[]> {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any, index: number) => ({
        id: item.id || `risk-${index}`,
        type: item.type || "other",
        severity: item.severity || "medium",
        title: item.title || "주의사항",
        message: item.message || "",
        deadline: item.deadline || undefined,
        amount: item.amount,
        conditions: item.conditions || [],
      }));
    }
  } catch (error) {
    console.error("Error parsing risks response:", error);
  }

  return [];
}

