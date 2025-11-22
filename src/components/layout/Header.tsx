"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { AccountDropdown } from "./AccountDropdown";
import { MobileMenu } from "./MobileMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  const navItems = [
    {
      label: t("navigation.documentAnalysis"),
      href: "/app",
    },
    {
      label: t("navigation.storage"),
      href: "/app/history",
    },
    {
      label: t("navigation.myCalendar"),
      href: "/app/calendar",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/images/logos/clearguidelogo.png"
                alt="클리어가이드"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
            <h1 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100">
              {t("navigation.brandName")}
            </h1>
          </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
            <Link 
                    key={item.href}
                    href={item.href}
                    className={`text-[14px] transition-colors ${
                      active
                        ? "text-[#0A1A2F] dark:text-blue-400 font-medium border-b-2 border-[#0A1A2F] dark:border-blue-400 pb-1"
                        : "text-[#6D6D6D] dark:text-gray-400 hover:text-[#0A1A2F] dark:hover:text-gray-100"
                    }`}
                  >
                    {item.label}
            </Link>
                );
              })}
          </nav>

            {/* Right Side: Language Switcher, Account Dropdown (Desktop) / Hamburger (Mobile) */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              <div className="hidden md:block">
                <AccountDropdown />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-[#6D6D6D]" />
              </button>
            </div>
          </div>
        </div>
    </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}

