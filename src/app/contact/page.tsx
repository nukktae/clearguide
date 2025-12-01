"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Github } from "lucide-react";

export default function ContactPage() {
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

        <h1 className="text-4xl font-bold text-[#1C2329] dark:text-gray-100 mb-4">
          문의하기
        </h1>
        <p className="text-[#6D6D6D] dark:text-gray-400 text-lg mb-12">
          ClearGuide에 대한 문의사항이나 피드백을 보내주세요.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Email Contact */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-[#2DB7A3] dark:hover:border-[#2DB7A3] transition-colors">
            <div className="w-12 h-12 bg-[#E8F7F5] dark:bg-[#2DB7A3]/20 rounded-xl flex items-center justify-center mb-6">
              <Mail className="h-6 w-6 text-[#2DB7A3]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1C2329] dark:text-gray-100 mb-2">
              이메일
            </h2>
            <p className="text-[#6D6D6D] dark:text-gray-400 mb-4">
              일반적인 문의사항 및 제안
            </p>
            <a
              href="mailto:support@clearguide.app"
              className="text-[#2DB7A3] hover:underline font-medium"
            >
              support@clearguide.app
            </a>
          </div>

          {/* Feedback */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-[#2DB7A3] dark:hover:border-[#2DB7A3] transition-colors">
            <div className="w-12 h-12 bg-[#E8F7F5] dark:bg-[#2DB7A3]/20 rounded-xl flex items-center justify-center mb-6">
              <MessageSquare className="h-6 w-6 text-[#2DB7A3]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1C2329] dark:text-gray-100 mb-2">
              피드백
            </h2>
            <p className="text-[#6D6D6D] dark:text-gray-400 mb-4">
              서비스 개선을 위한 의견
            </p>
            <a
              href="mailto:feedback@clearguide.app"
              className="text-[#2DB7A3] hover:underline font-medium"
            >
              feedback@clearguide.app
            </a>
          </div>

          {/* GitHub */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-[#2DB7A3] dark:hover:border-[#2DB7A3] transition-colors">
            <div className="w-12 h-12 bg-[#E8F7F5] dark:bg-[#2DB7A3]/20 rounded-xl flex items-center justify-center mb-6">
              <Github className="h-6 w-6 text-[#2DB7A3]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1C2329] dark:text-gray-100 mb-2">
              GitHub
            </h2>
            <p className="text-[#6D6D6D] dark:text-gray-400 mb-4">
              버그 리포트 및 기능 요청
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2DB7A3] hover:underline font-medium"
            >
              GitHub Issues
            </a>
          </div>

          {/* FAQ */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-[#1C2329] dark:text-gray-100 mb-4">
              자주 묻는 질문
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[#1C2329] dark:text-gray-200 mb-1">
                  Q: 어떤 종류의 문서를 분석할 수 있나요?
                </h3>
                <p className="text-sm text-[#6D6D6D] dark:text-gray-400">
                  A: PDF 파일과 이미지(JPG, PNG) 형식의 공공문서를 분석할 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[#1C2329] dark:text-gray-200 mb-1">
                  Q: 분석 결과는 얼마나 정확한가요?
                </h3>
                <p className="text-sm text-[#6D6D6D] dark:text-gray-400">
                  A: AI 기반 분석으로 높은 정확도를 제공하지만, 중요한 결정 시에는 원문 확인을 권장합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

