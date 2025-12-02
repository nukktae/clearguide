"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  AlertCircle, 
  XCircle, 
  Phone, 
  Users, 
  Building2, 
  Code2, 
  Crown, 
  Sparkles,
  Receipt,
  Briefcase,
  Plane,
  GraduationCap,
  Banknote,
  Upload,
  ArrowRight
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const t = useTranslations();
  
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Hero Section - Modern Banking Style */}
      <section className="relative bg-white dark:bg-[#0a0a0a] py-12 lg:py-16">
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
      </section>

      {/* Problem Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-5">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-4">
              {t("landing.problem.title")}
            </h2>
            <p className="text-base lg:text-lg text-[#86868b] dark:text-[#a1a1a6] max-w-2xl mx-auto">
              {t("landing.problem.description")}
            </p>
          </div>
          
          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: AlertCircle, text: t("landing.problem.challenges.confusion") },
              { icon: XCircle, text: t("landing.problem.challenges.mistakes") },
              { icon: Phone, text: t("landing.problem.challenges.overload") },
            ].map((item, idx) => (
              <div 
                key={idx}
                className="group bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-2xl p-6 hover:bg-[#e8e8ed] dark:hover:bg-[#2c2c2e] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#2c2c2e] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <item.icon className="h-5 w-5 text-[#86868b]" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          
          {/* Impact Statement */}
          <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-2xl p-8 text-center">
            <p className="text-base lg:text-lg text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed max-w-2xl mx-auto">
              {t("landing.problem.impact")}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-[#f5f5f7] dark:bg-[#1c1c1e]">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-12">
            {t("landing.features.title")}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Feature Card 1 - Action Guide */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg lg:text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("landing.features.actionGuide.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                {t("landing.features.actionGuide.description")}
              </p>
              
              {/* Preview UI */}
              <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#34c759] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">처리 완료</div>
                    <div className="text-xs text-[#86868b]">공공문서 분석이 완료되었습니다.</div>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-[#d2d2d7] dark:border-[#424245]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868b]">문서 유형</span>
                    <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">세금고지서</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868b]">처리 일시</span>
                    <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">2026.01.30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Card 2 - Easy Summary */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg lg:text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("landing.features.easySummary.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                {t("landing.features.easySummary.description")}
              </p>
              
              {/* Preview UI */}
              <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-xl p-5 space-y-2.5">
                {[
                  { icon: FileText, title: "핵심 요약", desc: "AI가 문서를 분석했습니다", color: "text-[#1d1d1f] dark:text-[#f5f5f7]" },
                  { icon: CheckCircle2, title: "해야 할 일", desc: "3개 항목이 있습니다", color: "text-[#34c759]" },
                  { icon: AlertTriangle, title: "주의사항", desc: "1개 위험 알림이 있습니다", color: "text-[#ff9f0a]" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#2c2c2e] rounded-lg">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{item.title}</div>
                      <div className="text-[10px] text-[#86868b]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Card 3 - Risk Alerts */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg lg:text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("landing.features.riskAlerts.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                {t("landing.features.riskAlerts.description")}
              </p>
              
              {/* Preview UI */}
              <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-[#ff9f0a]" />
                  <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">중요 알림</span>
                </div>
                <div className="p-4 bg-[#fff3cd] dark:bg-[#3d3320] rounded-lg border border-[#ff9f0a]/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-[#ff9f0a] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">마감일 임박</div>
                      <div className="text-[10px] text-[#86868b] mb-1">세금 납부 기한이 3일 남았습니다</div>
                      <div className="text-[10px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">마감일: 2026.02.02</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Card 4 - Document History */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg lg:text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("landing.features.documentHistory.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                {t("landing.features.documentHistory.description")}
              </p>
              
              {/* Preview UI */}
              <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-xl p-5">
                <div className="text-xs text-[#86868b] mb-3">최근 문서</div>
                <div className="space-y-2.5">
                  {[
                    { name: "세금고지서", date: "2026.01.30" },
                    { name: "과태료 고지서", date: "2026.01.25" },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#2c2c2e] rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] dark:bg-[#1c1c1e] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-[#86868b]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{doc.name}</div>
                        <div className="text-[10px] text-[#86868b]">{doc.date}</div>
                      </div>
                      <Calendar className="h-3.5 w-3.5 text-[#86868b] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-4">
              {t("documentTypes.title")}
            </h2>
            <p className="text-base text-[#86868b] dark:text-[#a1a1a6] max-w-2xl mx-auto">
              {t("documentTypes.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Government Documents */}
            <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("documentTypes.categories.government.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                세금고지서, 과태료, 주민센터 안내문 등 공공기관 문서를 분석합니다.
              </p>
              
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl p-5">
                <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-3">업로드된 문서</div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-[#34c759]/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-[#34c759]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">세금고지서</div>
                      <div className="text-[10px] text-[#86868b]">분석 완료</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-[#34c759]" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] dark:bg-[#424245] flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-[#86868b]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">과태료 고지서</div>
                      <div className="text-[10px] text-[#86868b]">분석 중...</div>
                    </div>
                    <Upload className="h-4 w-4 text-[#86868b] animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 mt-3 border-t border-[#d2d2d7] dark:border-[#424245]">
                  <span className="text-[#86868b]">지원 문서</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">4종류</span>
                </div>
              </div>
            </div>

            {/* Legal Documents */}
            <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("documentTypes.categories.legal.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                계약서, 고용 관련 문서 등 법적 문서를 쉽게 이해할 수 있습니다.
              </p>
              
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl p-5">
                <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-3">문서 분석</div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-[#86868b] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-0.5">계약서 분석</div>
                        <div className="text-[10px] text-[#86868b]">핵심 내용 3개 추출</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-[#86868b] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-0.5">고용 문서</div>
                        <div className="text-[10px] text-[#86868b]">중요 사항 2개 확인</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 mt-3 border-t border-[#d2d2d7] dark:border-[#424245]">
                  <span className="text-[#86868b]">지원 문서</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">2종류</span>
                </div>
              </div>
            </div>

            {/* Foreigner Documents */}
            <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-2xl p-6 lg:p-7">
              <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                {t("documentTypes.categories.foreigner.title")}
              </h3>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-5 leading-relaxed">
                외국인을 위한 이민, 학교, 은행 관련 문서를 지원합니다.
              </p>
              
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl p-5">
                <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-3">문서 업로드</div>
                <div className="p-4 border-2 border-dashed border-[#d2d2d7] dark:border-[#424245] rounded-lg mb-3">
                  <div className="flex flex-col items-center text-center py-2">
                    <Upload className="h-6 w-6 text-[#86868b] mb-2" />
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-0.5">파일을 드래그하세요</div>
                    <div className="text-[10px] text-[#86868b]">PDF, JPG, PNG 지원</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Plane, label: "이민 서류" },
                    { icon: GraduationCap, label: "학교 문서" },
                    { icon: Banknote, label: "은행 서류" },
                  ].map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded text-[10px] text-[#86868b]">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 lg:py-20 bg-[#f5f5f7] dark:bg-[#1c1c1e]">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-[#34c759]" />
              <span className="text-xs font-medium text-[#34c759]">
                {t("landing.roadmap.comingSoon")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-4">
              {t("landing.roadmap.title")}
            </h2>
            <p className="text-base text-[#86868b] dark:text-[#a1a1a6] max-w-2xl mx-auto">
              {t("landing.roadmap.subtitle")}
            </p>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                icon: Users, 
                label: t("landing.roadmap.phase1.label"),
                title: t("landing.roadmap.phase1.title"),
                desc: t("landing.roadmap.phase1.description"),
                status: t("landing.roadmap.phase1.status"),
                active: true 
              },
              { 
                icon: Building2, 
                label: t("landing.roadmap.phase2.label"),
                title: t("landing.roadmap.phase2.title"),
                desc: t("landing.roadmap.phase2.description"),
                status: t("landing.roadmap.phase2.status"),
                active: false 
              },
              { 
                icon: Code2, 
                label: t("landing.roadmap.phase3.label"),
                title: t("landing.roadmap.phase3.title"),
                desc: t("landing.roadmap.phase3.description"),
                status: t("landing.roadmap.phase3.status"),
                active: false 
              },
              { 
                icon: Crown, 
                label: t("landing.roadmap.phase4.label"),
                title: t("landing.roadmap.phase4.title"),
                desc: t("landing.roadmap.phase4.description"),
                status: t("landing.roadmap.phase4.status"),
                active: false 
              },
            ].map((phase, idx) => (
              <div 
                key={idx}
                className={`rounded-2xl p-5 ${
                  phase.active 
                    ? 'bg-white dark:bg-[#2c2c2e] ring-1 ring-[#34c759]/30' 
                    : 'bg-white/60 dark:bg-[#2c2c2e]/60'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  phase.active 
                    ? 'bg-[#34c759]/10' 
                    : 'bg-[#f5f5f7] dark:bg-[#1c1c1e]'
                }`}>
                  <phase.icon className={`h-5 w-5 ${
                    phase.active ? 'text-[#34c759]' : 'text-[#86868b]'
                  }`} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium ${
                    phase.active ? 'text-[#34c759]' : 'text-[#86868b]'
                  }`}>
                    {phase.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    phase.active 
                      ? 'bg-[#34c759] text-white' 
                      : 'bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#86868b]'
                  }`}>
                    {phase.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">
                  {phase.title}
                </h3>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-3">
            {t("landing.cta.title")}
          </h2>
          <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] mb-2">
            {t("landing.cta.subtitle")}
          </p>
          <p className="text-base text-[#86868b] dark:text-[#a1a1a6] mb-6">
            {t("landing.cta.description")}
          </p>
          <Link href="/app">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1d1d1f] dark:bg-[#0071e3] text-white rounded-full text-base font-medium hover:bg-black dark:hover:bg-[#0077ed] transition-colors">
              {t("landing.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d2d2d7] dark:border-[#424245]">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#86868b]">
            <Link href="/terms" className="hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors">
              {t("landing.footer.terms")}
            </Link>
            <span className="text-[#d2d2d7] dark:text-[#424245]">·</span>
            <Link href="/privacy" className="hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors">
              {t("landing.footer.privacy")}
            </Link>
            <span className="text-[#d2d2d7] dark:text-[#424245]">·</span>
            <Link href="/contact" className="hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors">
              {t("landing.footer.contact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
