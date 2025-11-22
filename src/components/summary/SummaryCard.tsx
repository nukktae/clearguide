"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/common/Card";
import { Summary } from "@/src/lib/parsing/types";
import { FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { EntityChips } from "./EntityChips";

export interface SummaryCardProps {
  summary: Summary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const t = useTranslations("summary");

  const getBulletIcon = (index: number) => {
    const icons = [FileText, CheckCircle2, AlertCircle, Info];
    return icons[index % icons.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[19px] font-medium">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {summary.bullets.map((bullet, index) => {
            const Icon = getBulletIcon(index);
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-[#2DB7A3]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] text-[#3C3C3C] leading-[1.75]">{bullet}</p>
              </div>
            );
          })}
        </div>
        <EntityChips entities={summary.entities} />
        {summary.docType && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-[14px] text-[#6D6D6D]">
              <span className="font-medium">문서 유형:</span> {summary.docType}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

