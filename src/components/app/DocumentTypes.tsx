"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Receipt,
  AlertTriangle,
  Building2,
  FileCheck,
  FileText,
  Briefcase,
  Plane,
  GraduationCap,
  Banknote,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface DocumentCategory {
  id: string;
  titleKey: string;
  mainIcon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  items: Array<{
    id: string;
    labelKey: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }>;
}

const categories: DocumentCategory[] = [
  {
    id: "government",
    titleKey: "documentTypes.categories.government.title",
    mainIcon: Building2,
    items: [
      { id: "tax", labelKey: "documentTypes.categories.government.tax", icon: Receipt },
      { id: "penalty", labelKey: "documentTypes.categories.government.penalty", icon: AlertTriangle },
      { id: "community", labelKey: "documentTypes.categories.government.community", icon: Building2 },
      { id: "government", labelKey: "documentTypes.categories.government.government", icon: FileCheck },
    ],
  },
  {
    id: "legal",
    titleKey: "documentTypes.categories.legal.title",
    mainIcon: FileText,
    items: [
      { id: "contract", labelKey: "documentTypes.categories.legal.contract", icon: FileText },
      { id: "employment", labelKey: "documentTypes.categories.legal.employment", icon: Briefcase },
    ],
  },
  {
    id: "foreigner",
    titleKey: "documentTypes.categories.foreigner.title",
    mainIcon: Plane,
    items: [
      { id: "immigration", labelKey: "documentTypes.categories.foreigner.immigration", icon: Plane },
      { id: "school", labelKey: "documentTypes.categories.foreigner.school", icon: GraduationCap },
      { id: "bank", labelKey: "documentTypes.categories.foreigner.bank", icon: Banknote },
    ],
  },
];

export function DocumentTypes() {
  const t = useTranslations();
  
  return (
    <div>
      {/* Section Header - Matching Features Section Style */}
      <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-center text-[#1A2A4F] dark:text-gray-100 mb-4">
        {t("documentTypes.title")}
      </h2>
      <p className="text-base text-[#4E535A] dark:text-gray-400 opacity-70 text-center mb-16 sm:mb-20 md:mb-24 leading-relaxed max-w-2xl mx-auto">
        {t("documentTypes.subtitle")}
      </p>

      {/* Category Grid - Matching Features Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
        {categories.map((category) => {
          const MainIcon = category.mainIcon;
          return (
            <div key={category.id} className="text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center mb-6 sm:mb-8 mt-2 sm:mt-4">
                <MainIcon className="h-8 w-8 text-[#1A2A4F] dark:text-white" strokeWidth={1.5} />
              </div>

              {/* Category Title */}
              <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">
                {t(category.titleKey)}
              </h3>

              {/* Category Items */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {category.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-sm text-[#4E535A] dark:text-gray-400 opacity-70"
                    >
                      <ItemIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{t(item.labelKey)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Foreign Users CTA - Matching Landing Page Style */}
      <div className="mt-16 sm:mt-20 md:mt-24 text-center">
        <div className="inline-flex items-start gap-3 px-6 py-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
          <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="text-left">
            <h4 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100 mb-1">
              {t("documentTypes.foreignerSupport.title")}
            </h4>
            <p className="text-sm text-[#4E535A] dark:text-gray-400 opacity-70 leading-relaxed">
              {t("documentTypes.foreignerSupport.description")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
