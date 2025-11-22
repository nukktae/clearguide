export type Language = "ko" | "en";
export type FontSize = "small" | "medium" | "large";
export type SummaryStyle = "brief" | "detailed" | "ultra-simple";
export type AutoDeleteDays = "7" | "30" | "never";

export interface UserPreferences {
  // Language settings
  language: Language;
  easyKoreanMode: boolean;

  // UI preferences
  darkMode: boolean;
  fontSize: FontSize;

  // Document preferences
  summaryStyle: SummaryStyle;

  // Notification settings
  deadlineAlerts: boolean;
  calendarReminders: boolean;
  analysisReady: boolean;
  weeklyReport: boolean;
  autoSyncDeadlines: boolean;

  // Security settings
  twoFactorEnabled: boolean;

  // Document data settings
  autoDeleteDays: AutoDeleteDays;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "ko",
  easyKoreanMode: false,
  darkMode: false,
  fontSize: "medium",
  summaryStyle: "brief",
  deadlineAlerts: true,
  calendarReminders: true,
  analysisReady: true,
  weeklyReport: false,
  autoSyncDeadlines: true,
  twoFactorEnabled: false,
  autoDeleteDays: "never",
};

