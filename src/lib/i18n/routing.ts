import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "always", // Always prefix routes with locale - works with [locale] folder
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

