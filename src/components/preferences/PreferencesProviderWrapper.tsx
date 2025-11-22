"use client";

import { PreferencesProvider } from "@/src/lib/preferences/PreferencesProvider";

export function PreferencesProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

