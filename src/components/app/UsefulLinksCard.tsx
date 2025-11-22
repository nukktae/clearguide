"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Building2, Receipt, Plane, Scale, Globe } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
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
    <div className="bg-transparent dark:bg-transparent">
      <h3 className="text-xs font-medium text-[#9BA0A7] dark:text-gray-500 mb-3 uppercase tracking-wider">
        {t("usefulLinks.title")}
      </h3>

      <div className="space-y-1.5">
        {usefulLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.url)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md",
                "text-[#6D6D6D] dark:text-gray-400",
                "hover:text-[#1A1A1A] dark:hover:text-gray-200",
                "hover:bg-gray-50/50 dark:hover:bg-gray-800/30",
                "transition-all group"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#9BA0A7] dark:text-gray-500 group-hover:text-[#6D6D6D] dark:group-hover:text-gray-400 transition-colors" />
              <span className="flex-1 text-left text-xs text-[#6D6D6D] dark:text-gray-400 group-hover:text-[#1A1A1A] dark:group-hover:text-gray-200 transition-colors">
                {link.label}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-[#9BA0A7] dark:text-gray-600 group-hover:text-[#6D6D6D] dark:group-hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

