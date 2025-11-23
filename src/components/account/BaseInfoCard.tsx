"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/common/Button";
import { User, Mail, Phone, Calendar, Lock, Edit2 } from "lucide-react";
import Image from "next/image";

interface BaseInfoCardProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  accountCreated: string;
  loginMethod: string;
  photoURL?: string | null;
  onEditName?: () => void;
  onEditEmail?: () => void;
  onEditPhone?: () => void;
  onEditAvatar?: () => void;
}

export function BaseInfoCard({
  userName,
  userEmail,
  userPhone,
  accountCreated,
  loginMethod,
  photoURL,
  onEditName,
  onEditEmail,
  onEditPhone,
  onEditAvatar,
}: BaseInfoCardProps) {
  const t = useTranslations();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-[#F4F6F9] dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-[#1C2329] dark:text-gray-200 overflow-hidden">
            {photoURL ? (
              <Image
                src={photoURL}
                alt={userName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <div>
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400 mb-1">{t("baseInfo.profilePicture")}</p>
            <Button variant="outline" size="sm" onClick={onEditAvatar}>
              {photoURL ? t("baseInfo.change") : "추가"}
            </Button>
          </div>
        </div>

        {/* Name */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{t("baseInfo.name")}</p>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditName}>
            <Edit2 className="h-4 w-4 mr-1" />
            {t("baseInfo.edit")}
          </Button>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{t("baseInfo.email")}</p>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{userEmail}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditEmail}>
            {t("baseInfo.change")}
          </Button>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        {/* Phone */}
        <div className="flex items-center justify-between py-2 pt-0">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{t("baseInfo.phoneNumber")}</p>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{userPhone || t("baseInfo.notRegistered")}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditPhone}>
            {userPhone ? t("baseInfo.change") : t("baseInfo.add")}
          </Button>
        </div>

        {/* Account Created */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{t("baseInfo.accountCreated")}</p>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{accountCreated}</p>
            </div>
          </div>
        </div>

        {/* Login Method */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{t("baseInfo.loginMethod")}</p>
              <p className="text-sm text-[#6D6D6D] dark:text-gray-400">{loginMethod}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

