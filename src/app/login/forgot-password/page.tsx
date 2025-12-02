"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/src/components/common/Input";
import { Spinner } from "@/src/components/common/Spinner";
import { resetPassword } from "@/src/lib/firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      
      // Handle Firebase auth errors gracefully
      let errorMessage = "비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요.";
      
      if (err.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "네트워크 연결을 확인해주세요.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center pl-8 lg:pl-16 xl:pl-24 pr-8 lg:pr-12 xl:pr-16 py-16">
        <div className={`w-full max-w-[400px] transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1C2329] mb-3">
              비밀번호 재설정
            </h1>
            <p className="text-base text-[#4E535A] leading-relaxed">
              {success 
                ? "비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요."
                : "가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다."}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                비밀번호 재설정 링크가 <strong>{email}</strong>로 전송되었습니다. 
                이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1C2329] mb-2">
                  이메일 주소
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                  disabled={isLoading}
                  className="w-full h-12 rounded-lg border border-gray-200 bg-[#F8F8F9] px-4 text-[#1C2329] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1C2329] focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#1C2329] text-white rounded-lg font-medium hover:bg-[#2A3441] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    전송 중…
                  </span>
                ) : (
                  "재설정 링크 보내기"
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#4E535A]">
              <Link href="/login" className="text-[#1C2329] font-medium hover:underline">
                ← 로그인으로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-start bg-white pl-8 xl:pl-12 py-16">
        <div className="relative w-full h-full max-w-xl">
          <Image
            src="/images/this.png"
            alt="Forgot password illustration"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

