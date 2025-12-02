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
import { useAuth } from "@/src/contexts/AuthContext";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const { user } = useAuth();
  
  // Check if user is authenticated
  const isAuthenticated = !!user;

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
    {
      label: "내 프로필",
      href: "/app/account",
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
      <header className="bg-white dark:bg-[#0F172A] sticky top-0 z-30 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo + Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href={isAuthenticated ? "/app" : "/"} className="flex items-center gap-2 shrink-0">
                <Image
                  src="/images/logos/clearguidelogo.png"
                  alt="클리어가이드"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
                {!isAuthenticated && (
                  <h1 className="text-lg font-semibold text-[#1C2329] dark:text-gray-100">
                    {t("navigation.brandName")}
                  </h1>
                )}
              </Link>

              {/* Desktop Navigation - Only show when authenticated */}
              {isAuthenticated && (
                <nav className="hidden lg:flex items-center gap-6">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={`text-sm font-medium transition-colors ${
                          active
                            ? "text-[#1C2329] dark:text-blue-400"
                            : "text-[#1C2329] dark:text-gray-400 hover:text-[#1C2329] dark:hover:text-gray-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right Side: Language Switcher, CTA Button, Account Dropdown */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Language Switcher - Hidden on mobile */}
              <div className="hidden md:block">
              <LanguageSwitcher />
              </div>
              
              {/* CTA Button - Only show when NOT authenticated */}
              {!isAuthenticated && (
                <div className="hidden md:block">
                  <Link href="/app">
                    <button className="px-5 py-2 bg-[#1C2329] dark:bg-gray-800 text-white rounded-full text-xs font-medium hover:bg-[#2A3441] dark:hover:bg-gray-700 transition-colors">
                      시작하기
                    </button>
                  </Link>
                </div>
              )}
              
              {/* Account Dropdown - Desktop - Only show when authenticated */}
              {isAuthenticated && (
                <div className="hidden lg:block">
                  <AccountDropdown />
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-[#1C2329] dark:text-gray-400" />
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

