"use client";

import * as React from "react";
import { FileText, Calendar, CheckCircle2, Building2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { useRouter } from "next/navigation";

interface EmptyChatStateProps {
  onStartDocumentAnalysis?: () => void;
}

const features = [
  {
    icon: FileText,
    title: "공공문서 요약",
    description: "복잡한 문서를 쉽게 이해할 수 있도록 요약해드립니다",
  },
  {
    icon: Calendar,
    title: "기한 설명",
    description: "중요한 마감일과 기한을 명확하게 안내합니다",
  },
  {
    icon: CheckCircle2,
    title: "해야 할 일 정리",
    description: "문서에서 필요한 조치사항을 체계적으로 정리합니다",
  },
  {
    icon: Building2,
    title: "주민센터/납부처 정보",
    description: "방문해야 할 곳과 연락처를 찾아드립니다",
  },
  {
    icon: Upload,
    title: "문서 업로드 도움",
    description: "문서 분석 과정을 안내하고 도와드립니다",
  },
];

export function EmptyChatState({ onStartDocumentAnalysis }: EmptyChatStateProps) {
  const router = useRouter();

  const handleStartAnalysis = () => {
    if (onStartDocumentAnalysis) {
      onStartDocumentAnalysis();
    } else {
      router.push("/app");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
        <Sparkles className="h-8 w-8 text-[#1A2A4F] dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
        ClearGuide AI가 할 수 있는 것들
      </h3>
      <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-6">
        공공문서 관련 궁금한 점을 언제든 물어보세요
      </p>
      <div className="w-full space-y-3 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-left"
            >
              <div className="shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-[#1A2A4F] dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100 mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-[#6D6D6D] dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={handleStartAnalysis} className="w-full">
        <Upload className="h-4 w-4 mr-2" />
        문서 분석 시작하기
      </Button>
      <p className="text-xs text-[#6D6D6D] dark:text-gray-400 mt-4">
        더 복잡한 문의는 담당자 연결 기능이 곧 제공될 예정입니다.
      </p>
    </div>
  );
}

