"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6D6D6D] hover:text-[#1C2329] dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로 돌아가기
        </Link>

        <h1 className="text-4xl font-bold text-[#1C2329] dark:text-gray-100 mb-8">
          이용약관
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-[#6D6D6D] dark:text-gray-400 mb-6">
            최종 업데이트: 2024년 12월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              제1조 (목적)
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              이 약관은 ClearGuide(이하 "서비스")가 제공하는 문서 분석 및 요약 서비스의 
              이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              제2조 (서비스 이용)
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed mb-4">
              서비스는 AI 기술을 활용하여 공공문서의 내용을 분석하고 이해하기 쉽게 요약하는 
              서비스를 제공합니다. 이용자는 다음 사항에 동의합니다:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] dark:text-gray-300 space-y-2">
              <li>업로드하는 문서에 대한 적법한 권한을 보유하고 있음</li>
              <li>서비스 결과를 참고용으로만 사용하고, 법적 조언으로 간주하지 않음</li>
              <li>타인의 개인정보가 포함된 문서의 무단 업로드를 금지</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              제3조 (면책조항)
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              AI 기반 분석 결과는 참고용이며, 중요한 결정 시에는 반드시 원문 확인 및 
              전문가 상담을 권장합니다. 서비스는 분석 결과의 정확성을 보장하지 않으며, 
              이로 인한 손해에 대해 책임지지 않습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              제4조 (문의)
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              이용약관에 관한 문의사항은{" "}
              <Link href="/contact" className="text-[#2DB7A3] hover:underline">
                문의하기
              </Link>
              {" "}페이지를 통해 연락해 주시기 바랍니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

