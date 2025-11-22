"use client";

import * as React from "react";

export function FontSizeDebugger() {
  React.useEffect(() => {
    const logFontSizes = () => {
      const html = document.documentElement;
      const body = document.body;
      
      const multiplier = html.style.getPropertyValue("--font-size-multiplier") || 
                        window.getComputedStyle(html).getPropertyValue("--font-size-multiplier");
      
      const bodyFontSize = window.getComputedStyle(body).fontSize;
      const htmlFontSize = window.getComputedStyle(html).fontSize;
      
      // Check landing page hero text
      const heroHeading = document.querySelector('h1');
      const heroText = heroHeading ? window.getComputedStyle(heroHeading).fontSize : null;
      const heroClasses = heroHeading ? heroHeading.className : null;
      const heroComputedFontSize = heroHeading ? window.getComputedStyle(heroHeading).getPropertyValue("font-size") : null;
      
      // Check description text
      const descriptionDiv = document.querySelector('div.text-sm, div.text-base, div.text-lg');
      const descriptionFontSize = descriptionDiv ? window.getComputedStyle(descriptionDiv).fontSize : null;
      
      console.log("[FontSizeDebugger] ===== FONT SIZE DEBUG =====");
      console.log("[FontSizeDebugger] --font-size-multiplier (CSS variable):", multiplier);
      console.log("[FontSizeDebugger] HTML font size:", htmlFontSize);
      console.log("[FontSizeDebugger] Body font size:", bodyFontSize);
      console.log("[FontSizeDebugger] Hero heading font size:", heroText);
      console.log("[FontSizeDebugger] Hero heading classes:", heroClasses);
      console.log("[FontSizeDebugger] Hero heading computed font-size property:", heroComputedFontSize);
      console.log("[FontSizeDebugger] Description font size:", descriptionFontSize);
      console.log("[FontSizeDebugger] Body font-size CSS:", window.getComputedStyle(body).getPropertyValue("font-size"));
      console.log("[FontSizeDebugger] ============================");
    };
    
    // Log immediately
    logFontSizes();
    
    // Log on resize
    window.addEventListener("resize", logFontSizes);
    
    // Log periodically to catch changes
    const interval = setInterval(logFontSizes, 2000);
    
    return () => {
      window.removeEventListener("resize", logFontSizes);
      clearInterval(interval);
    };
  }, []);
  
  return null;
}

