"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/src/components/common/Button";
import { useRouter } from "next/navigation";

export function EmptyState() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
        <FileText className="h-12 w-12 text-[#6D6D6D] dark:text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-gray-100 mb-2">
        {t("emptyState.title")}
      </h3>
      <p className="text-sm text-[#6D6D6D] dark:text-gray-400 text-center max-w-md mb-6">
        {t("emptyState.subtitle")}
      </p>
      <Button onClick={() => router.push("/app")}>
        <Upload className="h-4 w-4 mr-2" />
        {t("emptyState.uploadButton")}
      </Button>
    </div>
  );
}

