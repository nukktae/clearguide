"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Receipt,
  AlertTriangle,
  Building2,
  FileCheck,
  FileText,
  Briefcase,
  Plane,
  GraduationCap,
  Banknote,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export function DocumentTypes() {
  const t = useTranslations();
  
  return (
    <div>
      {/* Section Header */}
      <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-center text-[#1C2329] dark:text-gray-100 mb-4">
        {t("documentTypes.title")}
      </h2>
      <p className="text-base text-[#4E535A] dark:text-gray-400 text-center mb-16 sm:mb-20 md:mb-24 leading-relaxed max-w-2xl mx-auto">
        {t("documentTypes.subtitle")}
      </p>

      {/* Three Cards Grid - Matching Image Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Card 1 - Government Documents */}
        <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
          <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
            {t("documentTypes.categories.government.title")}
          </h3>
          <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
            세금고지서, 과태료, 주민센터 안내문 등 공공기관 문서를 분석합니다.
          </p>
          
          {/* Upload Preview UI */}
          <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-3">
                업로드된 문서
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[#01CD74]/10 flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5 text-[#01CD74]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 truncate">
                    세금고지서
                  </div>
                  <div className="text-xs text-[#4E535A] dark:text-gray-400">
                    분석 완료
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-[#01CD74] shrink-0" />
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[#1C2329]/10 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[#1C2329] dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 truncate">
                    과태료 고지서
                  </div>
                  <div className="text-xs text-[#4E535A] dark:text-gray-400">
                    분석 중...
                  </div>
                </div>
                <Upload className="h-4 w-4 text-[#4E535A] dark:text-gray-400 shrink-0 animate-pulse" />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4E535A] dark:text-gray-400">지원 문서</span>
                  <span className="font-medium text-[#1C2329] dark:text-gray-100">4종류</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 - Legal Documents */}
        <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
          <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
            {t("documentTypes.categories.legal.title")}
              </h3>
          <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
            계약서, 고용 관련 문서 등 법적 문서를 쉽게 이해할 수 있습니다.
          </p>
          
          {/* Document Preview UI */}
          <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-3">
                문서 분석
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#1C2329] dark:text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-1">
                      계약서 분석
                    </div>
                    <div className="text-xs text-[#4E535A] dark:text-gray-400 mb-2">
                      주요 조항을 요약했습니다
                    </div>
                    <div className="text-xs font-medium text-[#1C2329] dark:text-gray-100">
                      핵심 내용 3개 추출
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-[#1C2329] dark:text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-1">
                      고용 문서
                    </div>
                    <div className="text-xs text-[#4E535A] dark:text-gray-400 mb-2">
                      근로 조건을 명확히 정리했습니다
                    </div>
                    <div className="text-xs font-medium text-[#1C2329] dark:text-gray-100">
                      중요 사항 2개 확인
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#4E535A] dark:text-gray-400">지원 문서</span>
                  <span className="font-medium text-[#1C2329] dark:text-gray-100">2종류</span>
                </div>
              </div>
            </div>
          </div>
      </div>

        {/* Card 3 - Foreigner Documents */}
        <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
          <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
            {t("documentTypes.categories.foreigner.title")}
          </h3>
          <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
            외국인을 위한 이민, 학교, 은행 관련 문서를 지원합니다.
          </p>
          
          {/* Upload State UI */}
          <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-3">
                문서 업로드
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-[#F8F8F9] dark:bg-[#1E293B]">
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <Upload className="h-8 w-8 text-[#4E535A] dark:text-gray-400 mb-2" />
                  <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-1">
                    파일을 드래그하세요
                  </div>
                  <div className="text-xs text-[#4E535A] dark:text-gray-400">
                    PDF, JPG, PNG 지원
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#4E535A] dark:text-gray-400">
                    <Plane className="h-3.5 w-3.5" />
                    <span>이민 서류</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#4E535A] dark:text-gray-400">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>학교 문서</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#4E535A] dark:text-gray-400">
                    <Banknote className="h-3.5 w-3.5" />
                    <span>은행 서류</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
