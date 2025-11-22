"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { Checkbox } from "@/src/components/common/Checkbox";
import { Spinner } from "@/src/components/common/Spinner";

export default function SignUpPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert("약관에 동의해주세요.");
      return;
    }
    setIsLoading(true);
    // TODO: Implement actual signup logic with API
    // For MVP: Simulate signup success
    setTimeout(() => {
      // Set auth cookie
      document.cookie = "clearguide_auth=true; path=/; max-age=86400"; // 24 hours
      
      // Set localStorage for client-side checks
      localStorage.setItem("clearguide_auth", "true");
      
      setIsLoading(false);
      
      // Redirect to app
      router.push("/app");
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
              계정 만들기
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-[#0A1A2F] mb-1.5">
                이름
              </label>
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            {/* Terms Agreement */}
            <div className="pt-2">
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                label="이용약관 및 개인정보처리방침에 동의합니다"
              />
            </div>

            {/* Submit Button */}
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
                "무료로 시작하기"
              )}
            </Button>
          </form>

          {/* Reassurance Text */}
          <p className="text-[12px] text-[#9CA3AF] text-center mt-6 leading-relaxed">
            개인정보는 저장되지 않으며, 문서 분석은 사용자가 100% 통제합니다.
          </p>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-[13px] text-[#6D6D6D] hover:text-[#0A1A2F] transition-colors"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </div>

        {/* Security Reassurance */}
        <p className="text-[11px] text-[#9CA3AF] text-center mt-6 max-w-[420px] mx-auto leading-relaxed">
          AI 분석은 서버에 저장되지 않으며, 모든 문서는 사용자 기기에만 보관됩니다.
        </p>
      </div>
    </div>
  );
}

