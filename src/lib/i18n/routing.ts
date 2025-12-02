import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "as-needed", // Only prefix non-default locale routes
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

