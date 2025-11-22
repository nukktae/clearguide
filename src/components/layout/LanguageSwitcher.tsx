"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/src/lib/preferences";
import { cn } from "@/src/lib/utils/cn";

export function LanguageSwitcher() {
  const t = useTranslations();
  const { preferences, updatePreference } = usePreferences();
  const [currentLocale, setCurrentLocale] = React.useState<"ko" | "en">("ko");

  // Get current locale from cookie or preferences
  React.useEffect(() => {
    const localeCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clearguide_locale="));
    const cookieLocale = localeCookie?.split("=")[1];
    const locale = (cookieLocale || preferences.language || "ko") as "ko" | "en";
    setCurrentLocale(locale);
  }, [preferences.language]);

  const handleLanguageChange = (lang: "ko" | "en") => {
    // Set locale cookie
    document.cookie = `clearguide_locale=${lang}; path=/; max-age=31536000`; // 1 year expiry
    // Update preference
    updatePreference("language", lang);
    // Reload page to apply new locale
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-[#1E293B]">
      <button
        onClick={() => handleLanguageChange("ko")}
        className={cn(
          "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
          currentLocale === "ko"
            ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100 shadow-sm"
            : "text-[#6D6D6D] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
        title="한국어"
        aria-label="Switch to Korean"
      >
        🇰🇷
      </button>
      <button
        onClick={() => handleLanguageChange("en")}
        className={cn(
          "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
          currentLocale === "en"
            ? "bg-[#1A2A4F] dark:bg-blue-900/30 text-white dark:text-blue-100 shadow-sm"
            : "text-[#6D6D6D] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
        title="English"
        aria-label="Switch to English"
      >
        🇺🇸
      </button>
    </div>
  );
}

