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
import { EditNameModal } from "@/src/components/account/EditNameModal";
import { EditEmailModal } from "@/src/components/account/EditEmailModal";
import { EditPhoneModal } from "@/src/components/account/EditPhoneModal";
import { EditPhotoModal } from "@/src/components/account/EditPhotoModal";
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
  const [userName, setUserName] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [userPhone, setUserPhone] = React.useState("");
  const [photoURL, setPhotoURL] = React.useState<string | null>(null);
  const [accountCreated, setAccountCreated] = React.useState("");
  const [loginMethod, setLoginMethod] = React.useState("이메일 로그인");

  // Modal states
  const [isNameModalOpen, setIsNameModalOpen] = React.useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = React.useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);

  // Global preferences
  const { preferences, updatePreference, resetPreferences } = usePreferences();

  // Scroll state hooks - must be before conditional return
  const [isScrolled, setIsScrolled] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clearguide_auth="));

      const cookieValue = authCookie?.split("=")[1];
      const localStorageAuth = localStorage.getItem("clearguide_auth");
      
      // Check if authenticated (cookie has token OR localStorage has "true")
      const isAuth =
        (cookieValue && cookieValue.length >= 100) || // Firebase token
        cookieValue === "true" || // Legacy auth
        localStorageAuth === "true"; // localStorage auth

      if (!isAuth) {
        router.push("/login?redirect=/app/account");
        return;
      }

      try {
        // Get token from cookie to send in Authorization header
        const token = cookieValue && cookieValue.length >= 100 ? cookieValue : null;
        
        // Load profile data
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch("/app/api/profile", {
          headers,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("[Account Page] Profile data received:", data);
          console.log("[Account Page] Token used:", token ? `${token.substring(0, 20)}...` : "none");
          
          if (data.success && data.user) {
            console.log("[Account Page] User data:", {
              uid: data.user.uid,
              displayName: data.user.displayName,
              email: data.user.email,
              photoURL: data.user.photoURL,
            });
            
            // Use data from API, fallback to localStorage if needed
            const apiDisplayName = data.user.displayName;
            const apiEmail = data.user.email;
            
            // Fallback to localStorage if API returns null
            if (!apiDisplayName || !apiEmail) {
              const localUserStr = localStorage.getItem("clearguide_user");
              if (localUserStr) {
                try {
                  const localUser = JSON.parse(localUserStr);
                  console.log("[Account Page] Loading from localStorage:", localUser);
                  setUserName(apiDisplayName || localUser.displayName || localUser.email?.split("@")[0] || "사용자");
                  setUserEmail(apiEmail || localUser.email || "");
                } catch (e) {
                  console.error("[Account Page] Failed to parse localStorage user:", e);
                  setUserName(apiDisplayName || "사용자");
                  setUserEmail(apiEmail || "");
                }
              } else {
                setUserName(apiDisplayName || "사용자");
                setUserEmail(apiEmail || "");
              }
            } else {
              setUserName(apiDisplayName);
              setUserEmail(apiEmail);
            }
            
            setPhotoURL(data.user.photoURL);
            
            // Load phone from localStorage (since Firebase Auth doesn't store phone)
            const savedPhone = localStorage.getItem("user_phone");
            if (savedPhone) {
              setUserPhone(savedPhone);
            }

            // Set account created date (approximate from email verification or use current date)
            setAccountCreated(new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }));

            // Determine login method (simplified - could check provider)
            setLoginMethod("이메일 로그인");
          } else {
            console.error("[Account Page] Profile API returned error:", data);
            // Fallback to localStorage if API fails
            loadFromLocalStorage();
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("[Account Page] Profile API error:", response.status, errorData);
          // Fallback to localStorage if API fails
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error("[Account Page] Failed to load profile:", error);
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      const savedUser = localStorage.getItem("clearguide_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log("[Account Page] Loading from localStorage:", userData);
          setUserName(userData.displayName || userData.email?.split("@")[0] || "사용자");
          setUserEmail(userData.email || "");
          
          // Load phone from localStorage
          const savedPhone = localStorage.getItem("user_phone");
          if (savedPhone) {
            setUserPhone(savedPhone);
          }

          // Set account created date
          setAccountCreated(new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }));

          setLoginMethod("이메일 로그인");
        } catch (e) {
          console.error("[Account Page] Failed to parse localStorage user data:", e);
        }
      }
    };

    loadProfile();
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

  const handleSaveName = async (name: string) => {
    const response = await fetch("/app/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "이름 변경에 실패했습니다.");
    }

    setUserName(name);
  };

  const handleSaveEmail = async (email: string) => {
    // Note: Changing email in Firebase Auth requires re-authentication
    // For now, we'll just show an error message
    throw new Error("이메일 변경은 보안상의 이유로 지원되지 않습니다. 계정 설정에서 변경해주세요.");
  };

  const handleSavePhone = async (phone: string) => {
    // Store phone in localStorage (since Firebase Auth doesn't have phone field)
    localStorage.setItem("user_phone", phone);
    setUserPhone(phone);
  };

  const handleUploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/app/api/profile/photo", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "사진 업로드에 실패했습니다.");
    }

    const data = await response.json();
    setPhotoURL(data.photoURL);
  };

  const handleDeletePhoto = async () => {
    const response = await fetch("/app/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photoURL: null }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "사진 삭제에 실패했습니다.");
    }

    setPhotoURL(null);
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
                  photoURL={photoURL}
                  onEditName={() => setIsNameModalOpen(true)}
                  onEditEmail={() => setIsEmailModalOpen(true)}
                  onEditPhone={() => setIsPhoneModalOpen(true)}
                  onEditAvatar={() => setIsPhotoModalOpen(true)}
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

      {/* Edit Modals */}
      <EditNameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        currentName={userName}
        onSave={handleSaveName}
      />
      <EditEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={userEmail}
        onSave={handleSaveEmail}
      />
      <EditPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        currentPhone={userPhone}
        onSave={handleSavePhone}
      />
      <EditPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhotoUrl={photoURL}
        onUpload={handleUploadPhoto}
        onDelete={handleDeletePhoto}
      />
    </div>
  );
}
