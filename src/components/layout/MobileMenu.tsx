"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, FileText, FolderOpen, Calendar, User } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/src/contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, kakaoUser } = useAuth();
  
  // Check if user is authenticated
  const isAuthenticated = !!user || !!kakaoUser;

  const baseNavItems = [
    {
      label: t("mobileMenu.documentAnalysis"),
      href: "/app",
      icon: FileText,
    },
    {
      label: t("mobileMenu.archive"),
      href: "/app/history",
      icon: FolderOpen,
    },
    {
      label: t("mobileMenu.myCalendar"),
      href: "/app/calendar",
      icon: Calendar,
    },
  ];

  const accountNavItem = {
    label: t("mobileMenu.account"),
    href: "/app/account",
    icon: User,
  };

  const navItems = isAuthenticated 
    ? [...baseNavItems, accountNavItem]
    : baseNavItems;

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-[#1E293B] shadow-lg z-50 md:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100">{t("mobileMenu.title")}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors font-bold ${
                    active
                      ? "bg-[#0A1A2F]/10 dark:bg-blue-900/30 text-[#1C2329] dark:text-blue-400"
                      : "text-[#1C2329] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#0A1A2F] dark:hover:text-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* CTA Button - Only show when NOT authenticated */}
          {!isAuthenticated && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/app" onClick={onClose} className="block">
                <button className="w-full px-6 py-3 bg-[#1C2329] dark:bg-gray-800 text-white rounded-full text-sm font-medium hover:bg-[#2A3441] dark:hover:bg-gray-700 transition-colors">
                  시작하기
                </button>
              </Link>
            </div>
          )}

          {/* Language Switcher */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}

