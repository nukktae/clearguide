"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/src/components/common/Button";
import { FileText, CheckCircle2, AlertTriangle, Calendar, Shield, Sparkles, Lock } from "lucide-react";
import { FontSizeDebugger } from "@/src/components/debug/FontSizeDebugger";
import { DocumentTypes } from "@/src/components/app/DocumentTypes";

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
    <div className="min-h-screen bg-white dark:bg-[#0F172A]">
      <FontSizeDebugger />
      {/* Hero Section - 2025 Premium Minimalism */}
      <div className="relative bg-white dark:bg-[#0F172A]">
        {/* Soft gradient background */}
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-[#F8FAFC] to-white dark:from-[#1E293B] dark:to-[#0F172A] pointer-events-none" />
        
        {/* Subtle top-left radial fade */}
        <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient from-transparent via-transparent to-white dark:to-[#0F172A] opacity-30 pointer-events-none" 
             style={{
               background: 'radial-gradient(ellipse at top left, rgba(248, 250, 252, 0.3) 0%, transparent 50%)'
             }} />
        
        <div className="relative container mx-auto px-3 pt-32 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Premium minimal spark/insight icon */}
            <div className="flex items-center justify-center mb-8 sm:mb-10">
              <div className="relative">
                <svg
                  width="40"
                  height="40"
                  className="sm:w-12 sm:h-12 text-[#1A2A4F] dark:text-gray-300 opacity-70"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Minimal spark/insight icon */}
                  <path
                    d="M32 8L32 20M32 44L32 56M8 32L20 32M44 32L56 32M22 22L28 28M36 36L42 42M22 42L28 36M36 28L42 22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* Single headline with modern government-SaaS vibe */}
            <h1 className="!text-2xl sm:!text-3xl md:!text-4xl lg:!text-5xl xl:!text-6xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-8 leading-[1.1] tracking-tight">
              {t("landing.hero.title")}
            </h1>

            {/* Refined microcopy for trust */}
            <div className="!text-sm md:!text-base lg:!text-lg text-[#4E535A] dark:text-gray-400 opacity-70 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              <p>{t("landing.hero.subtitle")}</p>
            </div>

            {/* Navy CTA - premium tech style */}
            <div className="mb-12 sm:mb-16">
              <Link href="/app">
                <button className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 bg-[#1A2A4F] dark:bg-blue-600 text-white rounded-[999px] text-base sm:text-lg font-medium hover:bg-[#2A3A5F] dark:hover:bg-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(26,42,79,0.15)] hover:shadow-[0_4px_12px_rgba(26,42,79,0.2)]">
                  {t("landing.hero.cta")}
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 text-base text-[#6D6D6D] dark:text-gray-400 opacity-70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" strokeWidth={1.5} />
                <span>{t("landing.hero.trust.noDataStorage")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" strokeWidth={1.5} />
                <span>{t("landing.hero.trust.aiOptimized")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" strokeWidth={1.5} />
                <span>{t("landing.hero.trust.userControl")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Faint divider line */}
        <div className="border-t border-gray-100 dark:border-gray-700" />
      </div>

      {/* Features Section - Minimal Design */}
      <div className="bg-white dark:bg-[#0F172A] py-24 mt-12">
        <div className="container mx-auto px-3">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-center text-[#1A2A4F] dark:text-gray-100 mb-16 sm:mb-20 md:mb-24">
              {t("landing.features.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-6 sm:mb-8 mt-2 sm:mt-4">
                  <FileText className="h-8 w-8 text-[#1A2A4F] dark:text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
                  {t("landing.features.easySummary.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 leading-relaxed">
                  {t("landing.features.easySummary.description")}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-6 sm:mb-8 mt-2 sm:mt-4">
                  <CheckCircle2 className="h-8 w-8 text-[#1A2A4F] dark:text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
                  {t("landing.features.actionGuide.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 leading-relaxed">
                  {t("landing.features.actionGuide.description")}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-6 sm:mb-8 mt-2 sm:mt-4">
                  <AlertTriangle className="h-8 w-8 text-[#1A2A4F] dark:text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
                  {t("landing.features.riskAlerts.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 leading-relaxed">
                  {t("landing.features.riskAlerts.description")}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-6 sm:mb-8 mt-2 sm:mt-4">
                  <Calendar className="h-8 w-8 text-[#1A2A4F] dark:text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
                  {t("landing.features.documentHistory.title")}
                </h3>
                <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 leading-relaxed">
                  {t("landing.features.documentHistory.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Types Section */}
      <div className="bg-white dark:bg-[#0F172A] py-24 mt-12">
        <div className="container mx-auto px-3">
          <div className="max-w-5xl mx-auto">
            <DocumentTypes />
          </div>
        </div>
      </div>

      {/* CTA Section - Minimal */}
      <div className="bg-gradient-to-b from-[#F9FAFB] to-white dark:from-[#1E293B] dark:to-[#0F172A] border-t border-gray-100 dark:border-gray-700 mt-12">
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
              <button className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 bg-[#1A2A4F] dark:bg-blue-600 text-white rounded-[999px] text-base sm:text-lg font-medium hover:bg-[#2A3A5F] dark:hover:bg-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(26,42,79,0.15)] hover:shadow-[0_4px_12px_rgba(26,42,79,0.2)]">
                {t("landing.cta.button")}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] mt-12">
        <div className="container mx-auto px-3 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#7A7D85] dark:text-gray-500">
              <Link href="/terms" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.terms")}
              </Link>
              <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
              <Link href="/privacy" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.privacy")}
              </Link>
              <span className="text-[#E0E0E0] dark:text-gray-700">|</span>
              <Link href="/contact" className="hover:text-[#1A2A4F] dark:hover:text-gray-300 transition-colors">
                {t("landing.footer.contact")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

