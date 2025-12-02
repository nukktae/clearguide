import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "never", // Never add locale prefix to URLs - use cookie-based locale only
});

// Export navigation helpers - they won't add locale prefixes due to localePrefix: "never"
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

