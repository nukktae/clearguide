"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/common/Card";
import { CheckCircle2 } from "lucide-react";

export interface EligibilityCheckerProps {
  eligibilityHints?: string[];
}

export function EligibilityChecker({
  eligibilityHints,
}: EligibilityCheckerProps) {
  if (!eligibilityHints || eligibilityHints.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>대상자 확인</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {eligibilityHints.map((hint, index) => (
            <div key={index} className="flex items-start gap-4">
              <CheckCircle2 className="h-5 w-5 text-[#2DB7A3] shrink-0 mt-0.5" />
              <p className="text-[14px] text-[#3C3C3C]">{hint}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

