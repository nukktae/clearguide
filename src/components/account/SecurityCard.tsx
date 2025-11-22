"use client";

import * as React from "react";
import { Card, CardContent } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Checkbox } from "@/src/components/common/Checkbox";
import { Shield, Download, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface SecurityCardProps {
  twoFactorEnabled: boolean;
  onTwoFactorEnabledChange: (enabled: boolean) => void;
}

export function SecurityCard({
  twoFactorEnabled,
  onTwoFactorEnabledChange,
}: SecurityCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-out"
      >
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
          <h3 className="font-medium text-[#1A1A1A] dark:text-gray-100">개인정보 및 보안 설정</h3>
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
        <CardContent className="px-6 pb-6 pt-0 space-y-6">
          {/* Personal Data */}
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    문서는 저장되지 않습니다
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    모든 문서는 사용자 기기에만 보관되며, 서버에는 저장되지 않습니다.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              활동 로그 다운로드
            </Button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">2단계 인증</span>
                <Checkbox
                  checked={twoFactorEnabled}
                  onChange={(e) => onTwoFactorEnabledChange(e.target.checked)}
                  label=""
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">로그인된 기기</span>
                <Button variant="ghost" size="sm">
                  확인
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">다른 세션 로그아웃</span>
                <Button variant="ghost" size="sm">
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

