"use client";

import * as React from "react";
import { onAuthStateChange, signOutUser, AuthUser, getIdToken } from "@/src/lib/firebase/auth";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      // Update localStorage and cookie when auth state changes
      if (authUser) {
        // Get fresh token and update cookie
        try {
          const idToken = await getIdToken();
          if (idToken) {
            document.cookie = `clearguide_auth=${idToken}; path=/; max-age=86400; SameSite=Lax`;
          }
        } catch (error) {
          console.error("[AuthContext] Failed to get token:", error);
        }
        
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
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase
      if (user) {
        await signOutUser();
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

