"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Building2, Receipt, Plane, Scale, Globe } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const usefulLinks: LinkItem[] = [
  {
    id: "gov24",
    label: "정부24",
    url: "https://www.gov.kr",
    icon: Building2,
  },
  {
    id: "hometax",
    label: "홈택스",
    url: "https://www.hometax.go.kr",
    icon: Receipt,
  },
  {
    id: "immigration",
    label: "출입국청",
    url: "https://www.immigration.go.kr",
    icon: Plane,
  },
  {
    id: "hikorea",
    label: "HiKorea",
    url: "https://www.hikorea.go.kr/Main.pt",
    icon: Globe,
  },
  {
    id: "legal",
    label: "법률구조공단",
    url: "https://www.klac.or.kr",
    icon: Scale,
  },
];

export function UsefulLinksCard() {
  const t = useTranslations();
  
  const handleLinkClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-xs font-medium text-[#3C3C3C] dark:text-gray-300 mb-4 uppercase tracking-wider">
        {t("usefulLinks.title")}
      </h3>

      <div className="space-y-1">
        {usefulLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.url)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-[#1C2329] dark:text-gray-100",
                "hover:text-[#1C2329] dark:hover:text-gray-100",
                "hover:bg-[#F5F5F7] dark:hover:bg-[#1E293B]",
                "transition-all duration-200 group"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-[#3C3C3C] dark:text-gray-300 group-hover:text-[#1C2329] dark:group-hover:text-gray-100 transition-colors" strokeWidth={1.5} />
              <span className="flex-1 text-left text-sm text-[#1C2329] dark:text-gray-100 group-hover:text-[#1C2329] dark:group-hover:text-gray-100 transition-colors font-normal">
                {link.label}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#3C3C3C] dark:text-gray-400 group-hover:text-[#1C2329] dark:group-hover:text-gray-100 transition-all opacity-0 group-hover:opacity-100" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

