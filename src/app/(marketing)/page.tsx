"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/src/components/common/Button";
import { FileText, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";

export default function MarketingPage() {
  const t = useTranslations("upload");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2DB7A3]/10 mb-6">
            <FileText className="h-8 w-8 text-[#2DB7A3]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-[#6D6D6D] mb-8 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <Link href="/app">
            <Button size="lg" className="text-lg px-8 py-6">
              시작하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#F4F6F9] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-12">
              주요 기능
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-[#2DB7A3]/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-[#2DB7A3]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">
                  쉬운 요약
                </h3>
                <p className="text-sm text-[#6D6D6D]">
                  복잡한 공공문서를 쉽게 이해할 수 있도록 요약해드립니다.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-[#2DB7A3]/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-[#2DB7A3]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">
                  행동 가이드
                </h3>
                <p className="text-sm text-[#6D6D6D]">
                  무엇을 해야 하는지 단계별로 안내해드립니다.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-[#F2B84B]/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-[#F2B84B]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">
                  위험 알림
                </h3>
                <p className="text-sm text-[#6D6D6D]">
                  중요한 기한과 주의사항을 알려드립니다.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-[#2DB7A3]/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-[#2DB7A3]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">
                  문서 내역
                </h3>
                <p className="text-sm text-[#6D6D6D]">
                  이전에 분석한 문서를 언제든지 다시 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            지금 시작하세요
          </h2>
          <p className="text-[#6D6D6D] mb-8">
            공공문서를 업로드하고 AI의 도움을 받아 쉽게 이해하세요.
          </p>
          <Link href="/app">
            <Button size="lg" className="text-lg px-8 py-6">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

