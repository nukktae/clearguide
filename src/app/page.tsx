"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/src/components/common/Button";
import { FileText, CheckCircle2, AlertTriangle, Calendar, Shield, Sparkles, Lock } from "lucide-react";
import { FontSizeDebugger } from "@/src/components/debug/FontSizeDebugger";
import { DocumentTypes } from "@/src/components/app/DocumentTypes";
import Image from "next/image";

export default function HomePage() {
  const t = useTranslations();
  
  React.useEffect(() => {
    console.log("[HomePage] Component mounted");
    console.log("[HomePage] Current font-size-multiplier:", document.documentElement.style.getPropertyValue("--font-size-multiplier"));
    console.log("[HomePage] Computed font-size-multiplier:", window.getComputedStyle(document.documentElement).getPropertyValue("--font-size-multiplier"));
    
    const heroHeading = document.querySelector('h1');
    if (heroHeading) {
      console.log("[HomePage] Hero heading computed font size:", window.getComputedStyle(heroHeading).fontSize);
      console.log("[HomePage] Hero heading classes:", heroHeading.className);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0F172A]">
      <FontSizeDebugger />
      {/* Hero Section - Modern Banking Style */}
      <div className="relative bg-[#FFFFFF] dark:bg-[#0F172A] py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-6">
          {/* Large Rounded Container */}
          <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-3xl lg:rounded-[40px] p-6 lg:p-8 xl:p-10 overflow-hidden relative">
            <div className="relative w-full flex items-center justify-center">
              {/* Document Image */}
              <div className="relative w-full max-w-[500px] lg:max-w-[650px] xl:max-w-[750px] h-auto">
                <Image
                  src="/images/doc.png"
                  alt="Documents"
                  width={750}
                  height={563}
                  className="w-full h-auto object-contain"
                  priority
                  unoptimized
                />
                
                {/* Content Overlay on Top of Image */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  {/* Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C2329] dark:text-gray-100 mb-3 lg:mb-4 leading-tight">
              {t("landing.hero.title")}
            </h1>

                  {/* CTA Button */}
                  <div>
              <Link href="/app">
                      <button className="px-8 py-4 bg-[#1C2329] dark:bg-blue-600 text-white rounded-full text-base lg:text-lg font-semibold hover:bg-[#01CD74] dark:hover:bg-[#01CD74] hover:text-white transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:scale-105 transform">
                  {t("landing.hero.cta")}
                </button>
              </Link>
            </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faint divider line */}
        <div className="border-t border-gray-100 dark:border-gray-700 mt-16 lg:mt-24" />
      </div>

      {/* Features Section - Card Style */}
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] py-24 mt-12">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-center text-[#1C2329] dark:text-gray-100 mb-16 sm:mb-20 md:mb-24">
              {t("landing.features.title")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Card - Action Guide */}
              <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
                  {t("landing.features.actionGuide.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
                  {t("landing.features.actionGuide.description")}
                </p>
                
                {/* Success State UI */}
                <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#01CD74] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-bold text-[#1C2329] dark:text-gray-100">
                        처리 완료
                      </div>
                      <div className="text-sm text-[#4E535A] dark:text-gray-400">
                        공공문서 분석이 완료되었습니다.
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 mb-3">
                      처리 내역
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4E535A] dark:text-gray-400">문서 유형</span>
                        <span className="font-medium text-[#1C2329] dark:text-gray-100">세금고지서</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4E535A] dark:text-gray-400">처리 일시</span>
                        <span className="font-medium text-[#1C2329] dark:text-gray-100">2026.01.30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card - Dashboard Preview */}
              <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
                  {t("landing.features.easySummary.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
                  {t("landing.features.easySummary.description")}
                </p>
                
                {/* Dashboard Preview UI */}
                <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="mb-4">
                    <div className="text-xs text-[#4E535A] dark:text-gray-400 mb-2">홈 &gt; 문서 분석</div>
                    <div className="text-lg font-bold text-[#1C2329] dark:text-gray-100 mb-4">
                      문서 요약
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                      <FileText className="h-5 w-5 text-[#1C2329] dark:text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100">핵심 요약</div>
                        <div className="text-xs text-[#4E535A] dark:text-gray-400">AI가 문서를 분석했습니다</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-[#01CD74]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100">해야 할 일</div>
                        <div className="text-xs text-[#4E535A] dark:text-gray-400">3개 항목이 있습니다</div>
                      </div>
              </div>

                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-[#F2B84B]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100">주의사항</div>
                        <div className="text-xs text-[#4E535A] dark:text-gray-400">1개 위험 알림이 있습니다</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Card - Risk Alerts */}
              <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
                  {t("landing.features.riskAlerts.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
                  {t("landing.features.riskAlerts.description")}
                </p>
                
                {/* Risk Alert UI */}
                <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-[#F2B84B]" />
                      <div className="text-sm font-bold text-[#1C2329] dark:text-gray-100">
                        중요 알림
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-[#FFF3D6] dark:bg-[#2A2419] rounded-lg border border-[#F2B84B]/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#F2B84B] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[#1C2329] dark:text-gray-100 mb-1">
                            마감일 임박
                          </div>
                          <div className="text-xs text-[#4E535A] dark:text-gray-400 mb-2">
                            세금 납부 기한이 3일 남았습니다
                          </div>
                          <div className="text-xs font-medium text-[#1C2329] dark:text-gray-100">
                            마감일: 2026.02.02
                          </div>
                        </div>
                      </div>
              </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#4E535A] dark:text-gray-400">위험 알림</span>
                        <span className="font-medium text-[#1C2329] dark:text-gray-100">1개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fourth Card - Document History */}
              <div className="bg-[#F8F8F9] dark:bg-[#1E293B] rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-xl lg:text-2xl font-bold text-[#1C2329] dark:text-gray-100 mb-3">
                  {t("landing.features.documentHistory.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 mb-6 leading-relaxed">
                  {t("landing.features.documentHistory.description")}
                </p>
                
                {/* Document History UI */}
                <div className="bg-white dark:bg-[#0F172A] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="mb-4">
                    <div className="text-xs text-[#4E535A] dark:text-gray-400 mb-3">최근 문서</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-[#1C2329]/10 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-[#1C2329] dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 truncate">
                          세금고지서
                        </div>
                        <div className="text-xs text-[#4E535A] dark:text-gray-400">
                          2026.01.30
                        </div>
                      </div>
                      <Calendar className="h-4 w-4 text-[#4E535A] dark:text-gray-400 shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F9] dark:bg-[#1E293B] rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-[#1C2329]/10 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-[#1C2329] dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1C2329] dark:text-gray-100 truncate">
                          과태료 고지서
                        </div>
                        <div className="text-xs text-[#4E535A] dark:text-gray-400">
                          2026.01.25
                        </div>
                      </div>
                      <Calendar className="h-4 w-4 text-[#4E535A] dark:text-gray-400 shrink-0" />
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#4E535A] dark:text-gray-400">전체 문서</span>
                        <span className="font-medium text-[#1C2329] dark:text-gray-100">12개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Types Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] py-24 mt-12">
        <div className="container mx-auto px-3">
          <div className="max-w-5xl mx-auto">
            <DocumentTypes />
          </div>
        </div>
      </div>

      {/* CTA Section - Minimal */}
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border-t border-gray-100 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-3 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">
              {t("landing.cta.title")}
            </h2>
            <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 mb-2">
              {t("landing.cta.subtitle")}
            </p>
            <p className="text-lg text-[#4E535A] dark:text-gray-400 opacity-70 mb-10 leading-relaxed">
              {t("landing.cta.description")}
            </p>
            <Link href="/app">
              <button className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 bg-[#1C2329] dark:bg-blue-600 text-white rounded-[999px] text-base sm:text-lg font-medium hover:bg-[#2A3441] dark:hover:bg-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(28,35,41,0.15)] hover:shadow-[0_4px_12px_rgba(28,35,41,0.2)]">
                {t("landing.cta.button")}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-[#FFFFFF] dark:bg-[#0F172A] mt-12">
        <div className="container mx-auto px-3 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#7A7D85] dark:text-gray-500">
              <Link href="/terms" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.terms")}
              </Link>
              <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
              <Link href="/privacy" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.privacy")}
              </Link>
              <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
              <Link href="/contact" className="hover:text-[#1C2329] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.contact")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

