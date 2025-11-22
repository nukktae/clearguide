"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/common/Card";
import { ChecklistItem } from "@/src/lib/parsing/types";
import { CheckCircle2, Circle, MapPin, Calendar, FileText, Sparkles, ExternalLink, Plus, Phone, Globe } from "lucide-react";
import { Tag } from "@/src/components/common/Tag";
import { ShimmerSkeleton } from "@/src/components/common/Skeleton";
import { generateKakaoMapUrl, extractLocationFromText, getUserLocation, LocationInfo } from "@/src/lib/utils/kakaoMap";
import { formatDeadlineWithDays, downloadCalendarEvent, parseDeadline, getDeadlineStatus, DeadlineStatus } from "@/src/lib/utils/calendar";
import { generateCommunityCenterLinks } from "@/src/lib/utils/governmentLinks";

export interface ActionChecklistProps {
  actions: ChecklistItem[];
  onToggleComplete?: (id: string) => void;
  isLoading?: boolean;
  documentText?: string; // Raw text from document for location extraction
}

export function ActionChecklist({
  actions,
  onToggleComplete,
  isLoading = false,
  documentText,
}: ActionChecklistProps) {
  const t = useTranslations("actions");
  const [locationInfo, setLocationInfo] = React.useState<LocationInfo | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  // Extract location from document text on mount
  React.useEffect(() => {
    if (documentText) {
      const extracted = extractLocationFromText(documentText);
      setLocationInfo(extracted);
    }
  }, [documentText]);

  // Request user location on mount (if available)
  React.useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  const isCommunityCenterVisit = (locationName?: string, locationType?: string | null) => {
    if (locationType !== "offline") return false;
    if (!locationName) return false;
    return (
      locationName.includes("주민센터") ||
      locationName.includes("동주민센터") ||
      locationName.includes("구청") ||
      locationName.includes("시청")
    );
  };

  const handleKakaoMapClick = (locationName: string) => {
    const url = generateKakaoMapUrl(locationName, locationInfo || undefined, userLocation || undefined);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePhoneSearchClick = (locationName: string) => {
    const links = generateCommunityCenterLinks(locationName, locationInfo || undefined);
    if (links.phoneSearch) {
      window.open(links.phoneSearch, "_blank", "noopener,noreferrer");
    }
  };

  const handleWebsiteClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddToCalendar = (action: ChecklistItem) => {
    if (!action.deadline) return;
    
    const deadlineDate = parseDeadline(action.deadline);
    if (!deadlineDate) return;

    // Set time to end of day (23:59) for deadline
    deadlineDate.setHours(23, 59, 0, 0);

    downloadCalendarEvent({
      title: action.title,
      description: action.description || undefined,
      startDate: deadlineDate,
      endDate: deadlineDate,
      location: action.locationName || undefined,
    });
  };

  const getLocationIcon = (type: string | null | undefined) => {
    switch (type) {
      case "online":
        return "🌐";
      case "offline":
        return "🏢";
      case "phone":
        return "📞";
      case "mail":
        return "📮";
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || actions.length === 0 ? (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#2DB7A3] animate-pulse" strokeWidth={1.5} />
              <p className="text-[14px] text-[#6D6D6D] font-medium">AI가 검토 중...</p>
            </div>
            
            {/* Skeleton loaders */}
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200"
              >
                {/* Checkbox skeleton */}
                <div className="shrink-0 mt-0.5">
                  <ShimmerSkeleton className="h-6 w-6 rounded-full" />
                </div>
                
                {/* Content skeleton */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Title skeleton */}
                  <div className="flex items-start justify-between gap-2">
                    <ShimmerSkeleton className="h-5 w-3/4 rounded" />
                    <ShimmerSkeleton className="h-5 w-16 rounded-full" />
                  </div>
                  
                  {/* Description skeleton */}
                  <ShimmerSkeleton className="h-4 w-full rounded" />
                  <ShimmerSkeleton className="h-4 w-5/6 rounded" />
                  
                  {/* Metadata skeleton */}
                  <div className="flex flex-wrap gap-4">
                    <ShimmerSkeleton className="h-4 w-24 rounded" />
                    <ShimmerSkeleton className="h-4 w-32 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-[#F4F6F9] transition-colors"
              >
              <div className="shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => onToggleComplete?.(action.id)}
                  className="text-[#2DB7A3] hover:text-[#2DB7A3]/80 transition-colors"
                >
                  {action.completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-[#1A1A1A]">
                    {index + 1}. {action.title}
                  </h4>
                  {action.locationType && (
                    <Tag variant="default">
                      {getLocationIcon(action.locationType)} {t(action.locationType as any)}
                    </Tag>
                  )}
                </div>
                {action.description && (
                  <p className="text-[14px] text-[#3C3C3C] mb-4">
                    {action.description}
                  </p>
                )}
                
                {/* Action Bar - Two rows, two columns */}
                <div className="space-y-2.5">
                  {/* Row 1: Deadline */}
                  {action.deadline && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-[#6D6D6D]" />
                        {(() => {
                          const status = getDeadlineStatus(action.deadline);
                          const statusConfig = {
                            overdue: {
                              bg: "bg-red-50",
                              text: "text-red-700",
                              border: "border-red-200",
                            },
                            soon: {
                              bg: "bg-amber-50",
                              text: "text-amber-700",
                              border: "border-amber-200",
                            },
                            okay: {
                              bg: "bg-green-50",
                              text: "text-green-700",
                              border: "border-green-200",
                            },
                          };
                          const config = statusConfig[status];
                          return (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium border ${config.bg} ${config.text} ${config.border}`}
                            >
                              {formatDeadlineWithDays(action.deadline)}
                            </span>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => handleAddToCalendar(action)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3] shrink-0"
                        title="캘린더에 추가"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>캘린더에 추가</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Row 2: Location */}
                  {action.locationName && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-[14px] text-[#6D6D6D]">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{action.locationName}</span>
                      </div>
                      {isCommunityCenterVisit(action.locationName, action.locationType) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(() => {
                            const links = generateCommunityCenterLinks(action.locationName!, locationInfo || undefined);
                            return (
                              <>
                                <button
                                  onClick={() => handleKakaoMapClick(action.locationName!)}
                                  className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                  title="카카오맵에서 위치 보기"
                                >
                                  <MapPin className="h-3 w-3" />
                                  <span>지도</span>
                                </button>
                                <button
                                  onClick={() => handlePhoneSearchClick(action.locationName!)}
                                  className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                  title="전화번호 검색"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>전화</span>
                                </button>
                                {links.gov24 && (
                                  <button
                                    onClick={() => handleWebsiteClick(links.gov24!)}
                                    className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                    title="정부24 납부하기"
                                  >
                                    <Globe className="h-3 w-3" />
                                    <span>정부24</span>
                                  </button>
                                )}
                                {links.municipalOffice && (
                                  <button
                                    onClick={() => handleWebsiteClick(links.municipalOffice!)}
                                    className="flex items-center justify-center h-7 px-2.5 text-[11px] font-medium text-[#1A2A4F] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                    title="구청 홈페이지"
                                  >
                                    구청
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Required Docs / Preparation Info */}
                {action.locationType === "online" && action.requiredDocs && action.requiredDocs.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-[#6D6D6D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#6D6D6D] mb-2">
                            준비 정보:
                          </p>
                          <div className="space-y-1.5 text-xs text-[#6D6D6D]">
                            <div>
                              <span className="font-medium">예금주:</span> 홍길동
                            </div>
                            <div>
                              <span className="font-medium">은행:</span> 우리은행
                            </div>
                            <div>
                              <span className="font-medium">계좌번호:</span> 1234-5678-9012-34
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[#6D6D6D]">
                      <span className="font-medium">참고사항:</span> 입력된 예금주명과 계좌번호가 통지서와 동일한지 다시 한 번 확인해주세요.
                    </div>
                  </div>
                ) : action.requiredDocs && action.requiredDocs.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-[#6D6D6D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#6D6D6D] mb-2">
                            {t("requiredDocs")}:
                          </p>
                          <ul className="list-disc list-inside text-xs text-[#6D6D6D] space-y-1 ml-2">
                            {action.requiredDocs.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {action.notes && (
                      <div className="mt-3 text-xs text-[#6D6D6D] italic">
                        {t("notes")}: {action.notes}
                      </div>
                    )}
                  </div>
                ) : action.notes && action.locationType !== "online" ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-[#6D6D6D] italic">
                      {t("notes")}: {action.notes}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

