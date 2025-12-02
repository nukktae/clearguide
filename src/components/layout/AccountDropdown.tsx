"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";

export function AccountDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const { signOut, user } = useAuth();
  
  // Get display info from Firebase user
  const displayName = user?.displayName || null;
  const photoURL = user?.photoURL || null;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      // Fallback: clear cookies and localStorage manually
      document.cookie = "clearguide_auth=; path=/; max-age=0";
      localStorage.removeItem("clearguide_auth");
      localStorage.removeItem("clearguide_user");
      router.push("/login");
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-[#6D6D6D] dark:text-gray-400" />
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#6D6D6D] dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <Link
            href="/app/account"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#0A1A2F] dark:hover:text-gray-100 transition-colors"
          >
            <User className="h-4 w-4" />
            {t("navigation.profile")}
          </Link>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#0A1A2F] dark:hover:text-gray-100 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            {t("navigation.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

