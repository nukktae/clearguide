"use client";

import * as React from "react";
import { UserPreferences, DEFAULT_PREFERENCES } from "./types";
import { loadPreferences, savePreferences } from "./storage";

interface PreferencesContextValue {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = React.createContext<
  PreferencesContextValue | undefined
>(undefined);

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({
  children,
}: PreferencesProviderProps) {
  const [preferences, setPreferences] =
    React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = React.useState(false);

  // Load preferences from localStorage on mount and apply immediately
  React.useEffect(() => {
    console.log("[PreferencesProvider] Loading preferences from localStorage...");
    const loaded = loadPreferences();
    console.log("[PreferencesProvider] Loaded preferences:", loaded);
    console.log("[PreferencesProvider] Dark mode value:", loaded.darkMode);
    setPreferences(loaded);
    
    // Sync locale cookie with language preference
    const currentCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clearguide_locale="));
    const cookieLocale = currentCookie?.split("=")[1];
    
    if (cookieLocale !== loaded.language) {
      // Update cookie to match preference
      document.cookie = `clearguide_locale=${loaded.language}; path=/; max-age=31536000`;
      console.log("[PreferencesProvider] Synced locale cookie with preference:", loaded.language);
    }
    
    // Apply dark mode immediately on mount
    const html = document.documentElement;
    console.log("[PreferencesProvider] Current HTML classes before:", html.className);
    if (loaded.darkMode) {
      html.classList.add("dark");
      console.log("[PreferencesProvider] Added 'dark' class to HTML element");
    } else {
      html.classList.remove("dark");
      console.log("[PreferencesProvider] Removed 'dark' class from HTML element");
    }
    console.log("[PreferencesProvider] Current HTML classes after:", html.className);
    
    // Apply font size immediately on mount
    const multipliers = {
      small: "0.875",
      medium: "1",
      large: "1.125",
    };
    const multiplier = multipliers[loaded.fontSize];
    html.style.setProperty(
      "--font-size-multiplier",
      multiplier
    );
    console.log("[PreferencesProvider] Applied font size:", loaded.fontSize, "multiplier:", multiplier);
    console.log("[PreferencesProvider] HTML element font-size-multiplier:", html.style.getPropertyValue("--font-size-multiplier"));
    console.log("[PreferencesProvider] Computed font size multiplier:", window.getComputedStyle(html).getPropertyValue("--font-size-multiplier"));
    
    setMounted(true);
    console.log("[PreferencesProvider] Component mounted");
  }, []);

  // Apply dark mode when preference changes
  React.useEffect(() => {
    if (!mounted) {
      console.log("[PreferencesProvider] Not mounted yet, skipping dark mode application");
      return;
    }

    console.log("[PreferencesProvider] Dark mode preference changed:", preferences.darkMode);
    const html = document.documentElement;
    console.log("[PreferencesProvider] Current HTML classes before change:", html.className);
    
    if (preferences.darkMode) {
      html.classList.add("dark");
      console.log("[PreferencesProvider] ✅ Added 'dark' class to HTML element");
    } else {
      html.classList.remove("dark");
      console.log("[PreferencesProvider] ❌ Removed 'dark' class from HTML element");
    }
    
    console.log("[PreferencesProvider] Current HTML classes after change:", html.className);
    console.log("[PreferencesProvider] Has 'dark' class?", html.classList.contains("dark"));
    
    // Force a reflow to ensure styles are applied
    void html.offsetHeight;
    
    // Test if dark mode styles are working
    const testElement = document.createElement('div');
    testElement.className = 'bg-white dark:bg-gray-800';
    testElement.style.display = 'none';
    document.body.appendChild(testElement);
    const computedStyle = window.getComputedStyle(testElement);
    console.log("[PreferencesProvider] Test element background color:", computedStyle.backgroundColor);
    document.body.removeChild(testElement);
  }, [preferences.darkMode, mounted]);

  // Apply font size
  React.useEffect(() => {
    if (!mounted) {
      console.log("[PreferencesProvider] Font size effect - not mounted yet");
      return;
    }

    console.log("[PreferencesProvider] Font size preference changed:", preferences.fontSize);
    const html = document.documentElement;
    const multipliers = {
      small: "0.875",
      medium: "1",
      large: "1.125",
    };
    const multiplier = multipliers[preferences.fontSize];
    console.log("[PreferencesProvider] Setting font-size-multiplier to:", multiplier);
    html.style.setProperty(
      "--font-size-multiplier",
      multiplier
    );
    
    // Verify it was set
    const actualValue = html.style.getPropertyValue("--font-size-multiplier");
    console.log("[PreferencesProvider] Font-size-multiplier after setting:", actualValue);
    console.log("[PreferencesProvider] Computed font-size-multiplier:", window.getComputedStyle(html).getPropertyValue("--font-size-multiplier"));
    
    // Check body font size
    const body = document.body;
    const bodyFontSize = window.getComputedStyle(body).fontSize;
    console.log("[PreferencesProvider] Body computed font size:", bodyFontSize);
  }, [preferences.fontSize, mounted]);

  // Save preferences to localStorage whenever they change
  React.useEffect(() => {
    if (!mounted) {
      console.log("[PreferencesProvider] Not mounted yet, skipping save");
      return;
    }
    console.log("[PreferencesProvider] Saving preferences to localStorage:", preferences);
    savePreferences(preferences);
    console.log("[PreferencesProvider] Preferences saved successfully");
    
    // Sync locale cookie when language preference changes
    const currentCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clearguide_locale="));
    const cookieLocale = currentCookie?.split("=")[1];
    
    if (cookieLocale !== preferences.language) {
      document.cookie = `clearguide_locale=${preferences.language}; path=/; max-age=31536000`;
      console.log("[PreferencesProvider] Updated locale cookie to:", preferences.language);
    }
  }, [preferences, mounted]);

  const updatePreference = React.useCallback(
    <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      console.log("[PreferencesProvider] updatePreference called:", { key, value });
      setPreferences((prev) => {
        const updated = {
          ...prev,
          [key]: value,
        };
        console.log("[PreferencesProvider] Previous preferences:", prev);
        console.log("[PreferencesProvider] Updated preferences:", updated);
        return updated;
      });
    },
    []
  );

  const updatePreferences = React.useCallback(
    (partial: Partial<UserPreferences>) => {
      setPreferences((prev) => ({
        ...prev,
        ...partial,
      }));
    },
    []
  );

  const resetPreferences = React.useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value: PreferencesContextValue = {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export { PreferencesContext };

