"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { Checkbox } from "@/src/components/common/Checkbox";
import { Spinner } from "@/src/components/common/Spinner";
import { signUpEmailPassword, signInWithGoogle } from "@/src/lib/firebase/auth";

export default function SignUpPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!agreedToTerms) {
      setError("약관에 동의해주세요.");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await signUpEmailPassword(email, password, name);
      // Force refresh token to ensure it includes the updated displayName
      const idToken = await userCredential.user.getIdToken(true);
      
      console.log("[Signup] User created:", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      });
      
      // Set auth cookie with Firebase token
      document.cookie = `clearguide_auth=${idToken}; path=/; max-age=86400; SameSite=Lax`; // 24 hours
      
      // Set Firebase user info in localStorage
      localStorage.setItem("clearguide_auth", "true");
      localStorage.setItem("clearguide_user", JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || name,
      }));
      
      setIsLoading(false);
      
      // Redirect to app
      router.push("/app");
    } catch (err: any) {
      setIsLoading(false);
      
      // Handle Firebase auth errors gracefully
      let errorMessage = "회원가입에 실패했습니다. 다시 시도해주세요.";
      
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다. 로그인을 시도해주세요.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "네트워크 연결을 확인해주세요.";
      }
      
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const userCredential = await signInWithGoogle();
      const idToken = await userCredential.user.getIdToken();
      
      // Set auth cookie with Firebase token
      document.cookie = `clearguide_auth=${idToken}; path=/; max-age=86400; SameSite=Lax`;
      
      // Set Firebase user info in localStorage
      localStorage.setItem("clearguide_auth", "true");
      localStorage.setItem("clearguide_user", JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      }));
      
      setIsLoading(false);
      
      // Redirect to app
      router.push("/app");
    } catch (err: any) {
      setIsLoading(false);
      
      // Handle Google sign-in errors gracefully
      let errorMessage = "Google 로그인에 실패했습니다. 다시 시도해주세요.";
      
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "로그인 창이 닫혔습니다. 다시 시도해주세요.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "네트워크 연결을 확인해주세요.";
      }
      
      setError(errorMessage);
    }
  };

  const handleKakaoSignIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[Signup Page] Kakao sign-in button clicked");
    setError(null);
    setIsLoading(true);
    
    // Redirect to Kakao login endpoint using replace to avoid back button issues
    console.log("[Signup Page] Redirecting to /api/auth/kakao/login");
    window.location.replace("/api/auth/kakao/login");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center pl-8 lg:pl-16 xl:pl-24 pr-8 lg:pr-12 xl:pr-16 py-16">
        <div className={`w-full max-w-[400px] transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1C2329] mb-3">
              계정 만들기
            </h1>
            <p className="text-base text-[#4E535A] leading-relaxed">
              공공문서를 쉽게 이해하고 관리하세요. 무료로 시작하세요.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1C2329] mb-2">
                이름
              </label>
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                className="w-full h-12 rounded-lg border border-gray-200 bg-[#F8F8F9] px-4 text-[#1C2329] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1C2329] focus:border-transparent"
              />
            </div>

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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1C2329] mb-2">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                minLength={6}
                className="w-full h-12 rounded-lg border border-gray-200 bg-[#F8F8F9] px-4 text-[#1C2329] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1C2329] focus:border-transparent"
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300 text-[#1C2329] focus:ring-[#1C2329] mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-[#4E535A] cursor-pointer">
                이용약관 및 개인정보처리방침에 동의합니다
              </label>
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
                  로딩 중…
                </span>
              ) : (
                "무료로 시작하기"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-[#9CA3AF]">또는 다음으로 가입</span>
            </div>
          </div>

          {/* Social Sign Up */}
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-white border border-gray-200 text-sm font-medium text-[#1C2329] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 가입하기
            </button>
            <a
              href="/api/auth/kakao/login"
              onClick={(e) => {
                console.log("[Signup Page] Kakao link clicked");
                if (isLoading) {
                  e.preventDefault();
                  return false;
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-white border border-gray-200 text-sm font-medium text-[#1C2329] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm no-underline"
            >
              <Image
                src="/images/logos/kakaotalk-logo.png"
                alt="KakaoTalk"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              카카오로 가입하기
            </a>
          </div>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#4E535A]">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-[#1C2329] font-medium hover:underline">
                로그인
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
            alt="Signup illustration"
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

