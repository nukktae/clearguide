"use client";

import * as React from "react";

export function DarkModeScript() {
  React.useEffect(() => {
    console.log("[DarkModeScript] Running dark mode script...");
    try {
      const preferences = localStorage.getItem('clearguide_preferences');
      console.log("[DarkModeScript] Raw localStorage value:", preferences);
      
      if (preferences) {
        const parsed = JSON.parse(preferences);
        console.log("[DarkModeScript] Parsed preferences:", parsed);
        console.log("[DarkModeScript] Dark mode value:", parsed.darkMode);
        
        const html = document.documentElement;
        console.log("[DarkModeScript] Current HTML classes before:", html.className);
        
        if (parsed.darkMode) {
          html.classList.add('dark');
          console.log("[DarkModeScript] ✅ Added 'dark' class to HTML element");
        } else {
          html.classList.remove('dark');
          console.log("[DarkModeScript] ❌ Removed 'dark' class from HTML element");
        }
        
        console.log("[DarkModeScript] Current HTML classes after:", html.className);
        console.log("[DarkModeScript] Has 'dark' class?", html.classList.contains("dark"));
      } else {
        console.log("[DarkModeScript] No preferences found in localStorage");
      }
    } catch (e) {
      console.error('[DarkModeScript] Failed to apply dark mode:', e);
    }
  }, []);

  return null;
}
