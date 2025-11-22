"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Spinner } from "@/src/components/common/Spinner";
import { SettingsCard } from "@/src/components/account/SettingsCard";
import { BaseInfoCard } from "@/src/components/account/BaseInfoCard";
import { PreferencesCard } from "@/src/components/account/PreferencesCard";
import { NotificationsCard } from "@/src/components/account/NotificationsCard";
import { SecurityCard } from "@/src/components/account/SecurityCard";
import { DocumentsCard } from "@/src/components/account/DocumentsCard";
import { DangerZoneCard } from "@/src/components/account/DangerZoneCard";
import { usePreferences } from "@/src/lib/preferences";
import {
  User,
  Bell,
  FileText,
  Shield,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

type Section = "basic" | "preferences" | "notifications" | "security" | "documents" | "danger";

export default function AccountPage() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState<Section>("basic");
  const router = useRouter();


  // User state
  const [userName, setUserName] = React.useState("홍길동");
  const [userEmail, setUserEmail] = React.useState("user@example.com");
  const [userPhone, setUserPhone] = React.useState("010-1234-5678");
  const [accountCreated] = React.useState("2024년 1월 15일");
  const [loginMethod] = React.useState("이메일 로그인");

  // Global preferences
  const { preferences, updatePreference, resetPreferences } = usePreferences();

  // Scroll state hooks - must be before conditional return
  const [isScrolled, setIsScrolled] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkAuth = () => {
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clearguide_auth="));

      const isAuth =
        authCookie?.split("=")[1] === "true" ||
        localStorage.getItem("clearguide_auth") === "true";

      if (!isAuth) {
        router.push("/login?redirect=/app/account");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 20);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
      return () => contentElement.removeEventListener("scroll", handleScroll);
    }
  }, [activeSection]);

  const handleLogout = () => {
    document.cookie = "clearguide_auth=; path=/; max-age=0";
    localStorage.removeItem("clearguide_auth");
    router.push("/login");
  };

  const sidebarItems = [
    { id: "basic" as Section, labelKey: "account.sections.basic.title", icon: User },
    { id: "preferences" as Section, labelKey: "account.sections.preferences.title", icon: Settings },
    { id: "notifications" as Section, labelKey: "account.sections.notifications.title", icon: Bell },
    { id: "security" as Section, labelKey: "account.sections.security.title", icon: Shield },
    { id: "documents" as Section, labelKey: "account.sections.documents.title", icon: FileText },
    { id: "danger" as Section, labelKey: "account.sections.danger.title", icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[#6D6D6D]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const getSectionTitle = () => {
    const section = sidebarItems.find((item) => item.id === activeSection);
    return section ? t(section.labelKey) : "";
  };

  const getSectionDescription = () => {
    const descriptionKeys: Record<Section, string> = {
      basic: "account.sections.basic.description",
      preferences: "account.sections.preferences.description",
      notifications: "account.sections.notifications.description",
      security: "account.sections.security.description",
      documents: "account.sections.documents.description",
      danger: "account.sections.danger.description",
    };
    return t(descriptionKeys[activeSection]);
  };

  return (
    <div className="flex gap-8 h-[calc(100vh-8rem)] max-w-[1260px] mx-auto">
      {/* Left Sidebar - Fixed */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700">
        <nav className="sticky top-0 pt-4">
          <div className="px-2 space-y-1 relative">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ease-out",
                    isActive
                      ? "text-white"
                      : "text-[#6D6D6D] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#1A1A1A] dark:hover:text-gray-100"
                  )}
                >
                  {/* Active background with slide animation */}
                  {isActive && (
                    <div className="absolute inset-0 bg-[#0A1A2F] rounded-lg transition-all duration-300 ease-out" />
                  )}
                  <Icon className={cn("h-4 w-4 relative z-10 transition-transform duration-200", isActive && "scale-110")} />
                  <span className="relative z-10 font-medium">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Right Content - Scrollable */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <div className="space-y-6 pb-8">
          {/* Sticky Subheader */}
          <div
            className={cn(
              "sticky top-0 z-10 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 transition-all duration-300",
              isScrolled ? "py-4 shadow-sm" : "py-0"
            )}
          >
            <div className={cn("transition-all duration-300", isScrolled ? "opacity-100" : "opacity-0 h-0")}>
              <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100">{getSectionTitle()}</h2>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mt-1">{getSectionDescription()}</p>
            </div>
          </div>
          {/* Section 1: 기본 정보 */}
          {activeSection === "basic" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.basic.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.basic.description")}</p>
              </div>

              <SettingsCard title="" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <BaseInfoCard
                  userName={userName}
                  userEmail={userEmail}
                  userPhone={userPhone}
                  accountCreated={accountCreated}
                  loginMethod={loginMethod}
                  onEditName={() => console.log("Edit name")}
                  onEditEmail={() => console.log("Edit email")}
                  onEditPhone={() => console.log("Edit phone")}
                  onEditAvatar={() => console.log("Edit avatar")}
                />
              </SettingsCard>
            </div>
          )}

          {/* Section 2: 환경 설정 */}
          {activeSection === "preferences" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.preferences.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.preferences.description")}</p>
              </div>

              <PreferencesCard
                language={preferences.language}
                onLanguageChange={(lang) => updatePreference("language", lang as "ko" | "en")}
                easyKoreanMode={preferences.easyKoreanMode}
                onEasyKoreanModeChange={(enabled) =>
                  updatePreference("easyKoreanMode", enabled)
                }
                summaryStyle={preferences.summaryStyle}
                onSummaryStyleChange={(style) =>
                  updatePreference("summaryStyle", style as "brief" | "detailed" | "ultra-simple")
                }
                darkMode={preferences.darkMode}
                onDarkModeChange={(enabled) => {
                  console.log("[AccountPage] Dark mode change requested:", enabled);
                  console.log("[AccountPage] Current preferences.darkMode:", preferences.darkMode);
                  updatePreference("darkMode", enabled);
                  console.log("[AccountPage] Called updatePreference('darkMode',", enabled, ")");
                }}
                fontSize={preferences.fontSize}
                onFontSizeChange={(size) => updatePreference("fontSize", size as "small" | "medium" | "large")}
              />
            </div>
          )}

          {/* Section 3: 알림 & 캘린더 */}
          {activeSection === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.notifications.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.notifications.description")}</p>
              </div>

              <NotificationsCard
                deadlineAlerts={preferences.deadlineAlerts}
                onDeadlineAlertsChange={(enabled) =>
                  updatePreference("deadlineAlerts", enabled)
                }
                calendarReminders={preferences.calendarReminders}
                onCalendarRemindersChange={(enabled) =>
                  updatePreference("calendarReminders", enabled)
                }
                analysisReady={preferences.analysisReady}
                onAnalysisReadyChange={(enabled) =>
                  updatePreference("analysisReady", enabled)
                }
                weeklyReport={preferences.weeklyReport}
                onWeeklyReportChange={(enabled) =>
                  updatePreference("weeklyReport", enabled)
                }
                autoSyncDeadlines={preferences.autoSyncDeadlines}
                onAutoSyncDeadlinesChange={(enabled) =>
                  updatePreference("autoSyncDeadlines", enabled)
                }
              />
            </div>
          )}

          {/* Section 4: 개인정보 & 보안 (Accordion) */}
          {activeSection === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.security.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.security.description")}</p>
              </div>

              <SecurityCard
                twoFactorEnabled={preferences.twoFactorEnabled}
                onTwoFactorEnabledChange={(enabled) =>
                  updatePreference("twoFactorEnabled", enabled)
                }
              />
            </div>
          )}

          {/* Section 5: 문서 데이터 관리 (Accordion) */}
          {activeSection === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.documents.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.documents.description")}</p>
              </div>

              <DocumentsCard
                autoDeleteDays={preferences.autoDeleteDays}
                onAutoDeleteDaysChange={(days) =>
                  updatePreference("autoDeleteDays", days as "7" | "30" | "never")
                }
              />
            </div>
          )}

          {/* Section 6: 위험 구역 (Accordion with red border) */}
          {activeSection === "danger" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">{t("account.sections.danger.title")}</h2>
                <p className="text-[#6D6D6D] dark:text-gray-400">{t("account.sections.danger.description")}</p>
              </div>

              <DangerZoneCard
                onDeleteAccount={() => console.log("Delete account")}
                onDeleteAllData={() => console.log("Remove all personal data")}
                onResetSettings={resetPreferences}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
