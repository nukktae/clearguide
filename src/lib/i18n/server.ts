import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // Get locale from cookie only (no URL-based routing)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("clearguide_locale");
  
  // Use cookie locale if valid, otherwise default
  let locale: string;
  
  if (localeCookie && routing.locales.includes(localeCookie.value as any)) {
    locale = localeCookie.value;
  } else {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

