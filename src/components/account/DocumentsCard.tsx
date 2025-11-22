"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { FileText, ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface DocumentsCardProps {
  autoDeleteDays: string;
  onAutoDeleteDaysChange: (days: string) => void;
}

export function DocumentsCard({
  autoDeleteDays,
  onAutoDeleteDaysChange,
}: DocumentsCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-out"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
          <h3 className="font-medium text-[#1A1A1A] dark:text-gray-100">문서 데이터 설정</h3>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-[#6D6D6D] dark:text-gray-400 transition-transform duration-300 ease-out",
            expanded && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <CardContent className="px-6 pb-6 pt-0 space-y-4">
          <Link href="/app/history">
            <Button variant="outline" size="sm" className="w-full">
              내 보관함 바로가기
            </Button>
          </Link>
          <div className="space-y-2">
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">자동 삭제 설정</p>
            <div className="flex gap-2">
              <Button
                variant={autoDeleteDays === "7" ? "default" : "outline"}
                size="sm"
                onClick={() => onAutoDeleteDaysChange("7")}
                className="flex-1"
              >
                7일
              </Button>
              <Button
                variant={autoDeleteDays === "30" ? "default" : "outline"}
                size="sm"
                onClick={() => onAutoDeleteDaysChange("30")}
                className="flex-1"
              >
                30일
              </Button>
              <Button
                variant={autoDeleteDays === "never" ? "default" : "outline"}
                size="sm"
                onClick={() => onAutoDeleteDaysChange("never")}
                className="flex-1"
              >
                유지
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">향후: 가족/보호자 공유</p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

