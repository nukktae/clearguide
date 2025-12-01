"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@/src/components/common/Spinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const checkAuth = () => {
      // Check both cookie and localStorage
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clearguide_auth="));
      
      const isAuth = 
        (authCookie && authCookie.split("=")[1] === "true") ||
        localStorage.getItem("clearguide_auth") === "true";

      if (!isAuth) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[#6D6D6D] dark:text-gray-400">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

