"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Checkbox } from "@/src/components/common/Checkbox";
import { Globe, FileText, Eye } from "lucide-react";

interface PreferencesCardProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  easyKoreanMode: boolean;
  onEasyKoreanModeChange: (enabled: boolean) => void;
  summaryStyle: string;
  onSummaryStyleChange: (style: string) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

export function PreferencesCard({
  language,
  onLanguageChange,
  easyKoreanMode,
  onEasyKoreanModeChange,
  summaryStyle,
  onSummaryStyleChange,
  darkMode,
  onDarkModeChange,
  fontSize,
  onFontSizeChange,
}: PreferencesCardProps) {
  const t = useTranslations();
  
  const handleLanguageChange = (lang: string) => {
    // Set locale cookie
    document.cookie = `clearguide_locale=${lang}; path=/; max-age=31536000`; // 1 year expiry
    // Update preference
    onLanguageChange(lang);
    // Reload page to apply new locale
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Language */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 dark:text-gray-300" />
            {t("account.preferences.language.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={language === "ko" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("ko")}
              className="flex-1"
            >
              {t("account.preferences.language.korean")}
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("en")}
              className="flex-1"
            >
              {t("account.preferences.language.english")}
            </Button>
          </div>
          <Checkbox
            checked={easyKoreanMode}
            onChange={(e) => onEasyKoreanModeChange(e.target.checked)}
            label={t("account.preferences.language.easyKoreanMode")}
          />
        </CardContent>
      </Card>

      {/* Card 2: Summary Style */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 dark:text-gray-300" />
            {t("account.preferences.summaryStyle.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={summaryStyle === "brief" ? "default" : "outline"}
            size="sm"
            onClick={() => onSummaryStyleChange("brief")}
            className="w-full"
          >
            {t("account.preferences.summaryStyle.brief")}
          </Button>
          <Button
            variant={summaryStyle === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => onSummaryStyleChange("detailed")}
            className="w-full"
          >
            {t("account.preferences.summaryStyle.detailed")}
          </Button>
          <Button
            variant={summaryStyle === "ultra-simple" ? "default" : "outline"}
            size="sm"
            onClick={() => onSummaryStyleChange("ultra-simple")}
            className="w-full"
          >
            {t("account.preferences.summaryStyle.ultraSimple")}
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: UI Preferences */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-225">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 dark:text-gray-300" />
            {t("account.preferences.screen.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6D6D6D] dark:text-gray-400">{t("account.preferences.screen.darkMode")}</span>
            <Checkbox
              checked={darkMode}
              onChange={(e) => {
                console.log("[PreferencesCard] Dark mode checkbox changed:", e.target.checked);
                console.log("[PreferencesCard] Current darkMode prop:", darkMode);
                onDarkModeChange(e.target.checked);
                console.log("[PreferencesCard] Called onDarkModeChange with:", e.target.checked);
              }}
              label=""
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{t("account.preferences.screen.fontSize")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={fontSize === "small" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontSizeChange("small")}
              >
                {t("account.preferences.screen.small")}
              </Button>
              <Button
                variant={fontSize === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontSizeChange("medium")}
              >
                {t("account.preferences.screen.medium")}
              </Button>
              <Button
                variant={fontSize === "large" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontSizeChange("large")}
              >
                {t("account.preferences.screen.large")}
              </Button>
              <Button
                variant={fontSize === "xlarge" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontSizeChange("xlarge")}
              >
                {t("account.preferences.screen.xlarge")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

