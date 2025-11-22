"use client";

import * as React from "react";
import { Card, CardContent } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { AlertTriangle, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface DangerZoneCardProps {
  onDeleteAccount?: () => void;
  onDeleteAllData?: () => void;
  onResetSettings?: () => void;
}

export function DangerZoneCard({
  onDeleteAccount,
  onDeleteAllData,
  onResetSettings,
}: DangerZoneCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="border-red-200 bg-red-50/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-red-50/50 transition-all duration-200 ease-out"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-medium text-red-900">위험 구역</h3>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-red-600 transition-transform duration-300 ease-out",
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
          <div className="flex items-center justify-between py-2 border-b border-red-100">
            <div>
              <p className="text-sm text-red-900">계정 영구 삭제</p>
              <p className="text-xs text-red-700 mt-0.5">
                계정과 모든 데이터가 영구적으로 삭제됩니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (
                  confirm(
                    "정말 계정을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                  )
                ) {
                  onDeleteAccount?.();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-red-100">
            <div>
              <p className="text-sm text-red-900">모든 데이터 삭제</p>
              <p className="text-xs text-red-700 mt-0.5">
                저장된 모든 개인 정보가 삭제됩니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (
                  confirm(
                    "모든 개인 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                  )
                ) {
                  onDeleteAllData?.();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              제거
            </Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-red-900">설정 초기화</p>
              <p className="text-xs text-red-700 mt-0.5">
                모든 설정이 기본값으로 되돌아갑니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (confirm("모든 설정을 기본값으로 초기화하시겠습니까?")) {
                  onResetSettings?.();
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

