"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { Spinner } from "@/src/components/common/Spinner";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual login logic with API
    // For MVP: Simulate login success
    setTimeout(() => {
      // Set auth cookie
      document.cookie = "clearguide_auth=true; path=/; max-age=86400"; // 24 hours
      
      // Set localStorage for client-side checks
      localStorage.setItem("clearguide_auth", "true");
      
      setIsLoading(false);
      
      // Redirect to intended page or /app
      const redirectTo = searchParams.get("redirect") || "/app";
      router.push(redirectTo);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px]">
        {/* Card with animation */}
        <div
          className={`bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] p-8 border border-[#ECEEF3] transition-all duration-500 ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <Image
                src="/images/logos/clearguidelogo.png"
                alt="클리어가이드"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <h1 className="text-[24px] font-semibold text-[#1A1A1A] mb-2">
              클리어가이드
            </h1>
            <p className="text-[15px] text-[#6D6D6D]">로그인</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[#0A1A2F] mb-1.5">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-[#0A1A2F] mb-1.5">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-[14px] font-bold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  로딩 중…
                </span>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* Secondary Links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/login/forgot-password"
              className="text-[13px] text-[#6D6D6D] hover:text-[#1A2A4F] transition-colors"
            >
              비밀번호 찾기
            </Link>
            <span className="text-[#D4D7DD]">|</span>
            <Link
              href="/login/signup"
              className="text-[13px] text-[#6D6D6D] hover:text-[#0A1A2F] transition-colors"
            >
              회원가입
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#9CA3AF]">또는</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-2.5">
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-[14px] font-medium text-[#000000] hover:bg-[#FEE500]/90 transition-colors"
            >
              <Image
                src="/images/logos/kakaotalk-logo.png"
                alt="KakaoTalk"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              카카오 로그인
            </button>
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#03C75A] text-[14px] font-medium text-white hover:bg-[#03C75A]/90 transition-colors"
            >
              <span className="text-[16px]">N</span>
              네이버 로그인
            </button>
          </div>

          {/* Security Reassurance */}
          <p className="text-[11px] text-[#9CA3AF] text-center mt-6 leading-relaxed">
            AI 분석은 서버에 저장되지 않으며, 모든 문서는 사용자 기기에만 보관됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

