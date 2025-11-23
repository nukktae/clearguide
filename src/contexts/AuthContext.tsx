"use client";

import * as React from "react";
import { onAuthStateChange, signOutUser, AuthUser } from "@/src/lib/firebase/auth";
import { getKakaoSessionClient, clearKakaoSessionClient, KakaoUser } from "@/src/lib/auth/kakao";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  kakaoUser: KakaoUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [kakaoUser, setKakaoUser] = React.useState<KakaoUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  // Check for Kakao session on mount and when cookies change
  React.useEffect(() => {
    const checkKakaoSession = () => {
      const kakaoSession = getKakaoSessionClient();
      setKakaoUser(kakaoSession);
    };

    checkKakaoSession();

    // Check periodically for Kakao session changes (e.g., after callback)
    const interval = setInterval(checkKakaoSession, 1000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      
      // Update localStorage and cookie when auth state changes
      if (authUser) {
        localStorage.setItem("clearguide_auth", "true");
        localStorage.setItem(
          "clearguide_user",
          JSON.stringify({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
          })
        );
        setLoading(false);
      } else {
        localStorage.removeItem("clearguide_auth");
        localStorage.removeItem("clearguide_user");
        document.cookie = "clearguide_auth=; path=/; max-age=0";
        
        // Check if we have Kakao session instead
        const kakaoSession = getKakaoSessionClient();
        if (kakaoSession) {
          setKakaoUser(kakaoSession);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase if logged in with Firebase
      if (user) {
        await signOutUser();
      }
      
      // Clear Kakao session if logged in with Kakao
      if (kakaoUser) {
        clearKakaoSessionClient();
        setKakaoUser(null);
      }
      
      router.push("/login");
    } catch (error) {
      // Silently handle sign out errors - user will be redirected anyway
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        kakaoUser,
        loading,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

