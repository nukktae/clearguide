import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { HeaderWrapper } from "@/src/components/layout/HeaderWrapper";
import { PreferencesProviderWrapper } from "@/src/components/preferences/PreferencesProviderWrapper";
import { DarkModeScript } from "@/src/components/preferences/DarkModeScript";
import { ChatbotWrapper } from "@/src/components/chat/ChatbotWrapper";
import { AuthProvider } from "@/src/contexts/AuthContext";
import "./globals.css";

const batang = localFont({
  src: "./../../public/font/BATANG.ttf",
  variable: "--font-batang",
  display: "swap",
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
    <html lang={locale} className="bg-[#FFFFFF]">
      <body className={`${batang.variable} antialiased bg-[#FFFFFF]`}>
        <DarkModeScript />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PreferencesProviderWrapper>
              <HeaderWrapper />
              {children}
              <ChatbotWrapper />
            </PreferencesProviderWrapper>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

