import { UserPreferences, DEFAULT_PREFERENCES } from "./types";

const STORAGE_KEY = "clearguide_preferences";

/**
 * Load preferences from localStorage
 * Returns default preferences if none exist or if there's an error
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    console.log("[Storage] Server-side, returning default preferences");
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("[Storage] Raw localStorage value:", stored);
    
    if (!stored) {
      console.log("[Storage] No stored preferences found, returning defaults");
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    console.log("[Storage] Parsed preferences:", parsed);
    
    // Merge with defaults to ensure all fields exist
    const merged = {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
    console.log("[Storage] Merged preferences (with defaults):", merged);
    console.log("[Storage] Dark mode in merged:", merged.darkMode);
    
    return merged;
  } catch (error) {
    console.error("[Storage] Failed to load preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") {
    console.log("[Storage] Server-side, cannot save preferences");
    return;
  }

  try {
    console.log("[Storage] Saving preferences to localStorage:", preferences);
    console.log("[Storage] Dark mode value being saved:", preferences.darkMode);
    const jsonString = JSON.stringify(preferences);
    console.log("[Storage] JSON string to save:", jsonString);
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    // Verify it was saved
    const verify = localStorage.getItem(STORAGE_KEY);
    console.log("[Storage] Verification - read back from localStorage:", verify);
    const verifyParsed = JSON.parse(verify || "{}");
    console.log("[Storage] Verification - parsed:", verifyParsed);
    console.log("[Storage] Verification - dark mode:", verifyParsed.darkMode);
  } catch (error) {
    console.error("[Storage] Failed to save preferences:", error);
  }
}

/**
 * Get default preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return { ...DEFAULT_PREFERENCES };
}

