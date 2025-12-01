"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          개인정보처리방침
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-[#6D6D6D] dark:text-gray-400 mb-6">
            최종 업데이트: 2024년 12월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              1. 수집하는 개인정보
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed mb-4">
              ClearGuide는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] dark:text-gray-300 space-y-2">
              <li>이메일 주소 (Google 로그인 시)</li>
              <li>업로드된 문서 내용 (서비스 분석 목적)</li>
              <li>서비스 이용 기록</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              2. 개인정보의 이용 목적
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed mb-4">
              수집된 정보는 다음과 같은 목적으로만 사용됩니다:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] dark:text-gray-300 space-y-2">
              <li>문서 분석 및 요약 서비스 제공</li>
              <li>사용자 맞춤 서비스 제공</li>
              <li>서비스 품질 개선</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              3. 개인정보의 보관 및 파기
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              업로드된 문서는 분석 후 서버에 안전하게 저장되며, 사용자 요청 시 
              즉시 삭제됩니다. 회원 탈퇴 시 모든 개인정보는 지체 없이 파기됩니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              4. 제3자 제공
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              ClearGuide는 사용자의 개인정보를 제3자에게 제공하지 않습니다. 
              단, 문서 분석을 위해 OpenAI API를 사용하며, 이 과정에서 문서 내용이 
              처리될 수 있습니다. OpenAI의 개인정보처리방침은{" "}
              <a 
                href="https://openai.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#2DB7A3] hover:underline"
              >
                여기
              </a>
              에서 확인하실 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              5. 이용자의 권리
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed mb-4">
              이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] dark:text-gray-300 space-y-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>서비스 탈퇴</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              6. 문의
            </h2>
            <p className="text-[#4A4A4A] dark:text-gray-300 leading-relaxed">
              개인정보처리방침에 관한 문의사항은{" "}
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

