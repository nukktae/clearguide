import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { HeaderWrapper } from "@/src/components/layout/HeaderWrapper";
import { PreferencesProviderWrapper } from "@/src/components/preferences/PreferencesProviderWrapper";
import { DarkModeScript } from "@/src/components/preferences/DarkModeScript";
import { ChatbotWrapper } from "@/src/components/chat/ChatbotWrapper";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-pretendard",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "클리어가이드 | ClearGuide",
  description: "세금고지서, 과태료, 주민센터 안내문 등을 쉽게 이해하세요",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale from cookie or default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("clearguide_locale");
  const locale = localeCookie?.value || "ko";
  
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={`${notoSansKR.variable} antialiased`}>
        <DarkModeScript />
        <NextIntlClientProvider messages={messages}>
          <PreferencesProviderWrapper>
            <HeaderWrapper />
            {children}
            <ChatbotWrapper />
          </PreferencesProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

