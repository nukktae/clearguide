"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/common/Card";
import { ChecklistItem } from "@/src/lib/parsing/types";
import { CheckCircle2, Circle, MapPin, Calendar, FileText, Sparkles, ExternalLink, Plus, Phone, Globe } from "lucide-react";
import { Tag } from "@/src/components/common/Tag";
import { ShimmerSkeleton } from "@/src/components/common/Skeleton";
import { Spinner } from "@/src/components/common/Spinner";
import { generateKakaoMapUrl, extractLocationFromText, getUserLocation, LocationInfo } from "@/src/lib/utils/kakaoMap";
import { formatDeadlineWithDays, parseDeadline, getDeadlineStatus, DeadlineStatus, deadlineToString } from "@/src/lib/utils/calendar";
import { useRouter } from "next/navigation";
import { generateCommunityCenterLinks } from "@/src/lib/utils/governmentLinks";
import { getIdToken } from "@/src/lib/firebase/auth";

export interface ActionChecklistProps {
  actions: ChecklistItem[];
  onToggleComplete?: (id: string) => void;
  isLoading?: boolean;
  documentText?: string; // Raw text from document for location extraction
  documentId?: string; // Document ID for calendar events
  documentName?: string; // Document name for calendar events
}

/**
 * Convert deadline to string, handling Firestore Timestamps
 */
function normalizeDeadline(deadline: any): string | undefined {
  if (!deadline) return undefined;
  if (typeof deadline === "string") return deadline;
  
  // Handle Firestore Timestamp objects (client SDK or Admin SDK)
  if (deadline && typeof deadline === "object") {
    // Client SDK Timestamp
    if (typeof deadline.toDate === "function") {
      return deadline.toDate().toISOString().split("T")[0];
    }
    // Admin SDK Timestamp or plain object with _seconds
    if (deadline._seconds !== undefined) {
      const date = new Date(deadline._seconds * 1000 + (deadline._nanoseconds || 0) / 1000000);
      return date.toISOString().split("T")[0];
    }
    // Already a Date
    if (deadline instanceof Date) {
      return deadline.toISOString().split("T")[0];
    }
  }
  
  // Use the utility function as fallback
  return deadlineToString(deadline);
}

export function ActionChecklist({
  actions,
  onToggleComplete,
  isLoading = false,
  documentText,
  documentId,
  documentName,
}: ActionChecklistProps) {
  const t = useTranslations("actions");
  const router = useRouter();
  const [locationInfo, setLocationInfo] = React.useState<LocationInfo | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = React.useState<string | null>(null);

  // Normalize deadlines in actions to ensure they're always strings
  const normalizedActions = React.useMemo(() => {
    if (!actions || actions.length === 0) return [];
    return actions.map(action => ({
      ...action,
      deadline: action.deadline ? normalizeDeadline(action.deadline) : undefined,
    }));
  }, [actions]);

  // Debug logging
  React.useEffect(() => {
    console.log("[ActionChecklist] Props:", {
      actionsCount: normalizedActions?.length || 0,
      isLoading,
      documentId,
      documentName,
      actions: normalizedActions?.slice(0, 2), // Log first 2 actions
    });
  }, [normalizedActions, isLoading, documentId, documentName]);

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

  const handleAddToCalendar = async (action: ChecklistItem) => {
    if (!action.deadline) return;
    
    // Normalize deadline to string first
    const normalizedDeadline = normalizeDeadline(action.deadline);
    if (!normalizedDeadline) return;
    
    const deadlineDate = parseDeadline(normalizedDeadline);
    if (!deadlineDate) return;

    setIsAddingToCalendar(action.id);

    try {
      // Determine urgency based on deadline status
      const deadlineStatus = getDeadlineStatus(normalizedDeadline);
      let urgency: "critical" | "high" | "medium" | "low" | "action" = "action";
      
      if (deadlineStatus === "overdue") {
        urgency = "critical";
      } else if (deadlineStatus === "soon") {
        urgency = "high";
      } else {
        urgency = "medium";
      }

      // Format deadline as YYYY-MM-DD (already normalized)
      const deadlineStr = normalizedDeadline;

      const token = await getIdToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: action.title,
          description: action.description || undefined,
          deadline: deadlineStr,
          urgency: urgency,
          documentId: documentId,
          documentName: documentName,
          type: "action",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "캘린더에 추가하는데 실패했습니다.");
      }

      // Redirect to calendar page
      router.push("/app/calendar");
    } catch (error) {
      console.error("Error adding to calendar:", error);
      alert(error instanceof Error ? error.message : "캘린더에 추가하는데 실패했습니다.");
    } finally {
      setIsAddingToCalendar(null);
    }
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
        {isLoading ? (
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
        ) : normalizedActions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#6D6D6D] dark:text-gray-400">
              이 문서에는 추출된 행동 항목이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedActions.map((action, index) => (
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
                        disabled={isAddingToCalendar === action.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="캘린더에 추가"
                      >
                        {isAddingToCalendar === action.id ? (
                          <>
                            <Spinner size="sm" />
                            <span>추가 중...</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>캘린더에 추가</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Row 2: Location / Website */}
                  {(action.locationName || action.websiteUrl) && (
                    <div className="flex items-center justify-between gap-4">
                      {action.locationName ? (
                        <div className="flex items-center gap-1.5 text-[14px] text-[#6D6D6D]">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{action.locationName}</span>
                        </div>
                      ) : action.websiteUrl ? (
                        <div className="flex items-center gap-1.5 text-[14px] text-[#6D6D6D]">
                          <Globe className="h-4 w-4 shrink-0" />
                          <span className="truncate">{action.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                        </div>
                      ) : null}
                      {action.locationType === "online" && action.websiteUrl && (
                        <button
                          onClick={() => handleWebsiteClick(action.websiteUrl!)}
                          className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3] shrink-0"
                          title="웹사이트 열기"
                        >
                          <Globe className="h-3 w-3" />
                          <span>웹사이트</span>
                        </button>
                      )}
                      {isCommunityCenterVisit(action.locationName, action.locationType) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(() => {
                            const links = generateCommunityCenterLinks(action.locationName!, locationInfo || undefined);
                            return (
                              <>
                                <button
                                  onClick={() => handleKakaoMapClick(action.locationName!)}
                                  className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                  title="카카오맵에서 위치 보기"
                                >
                                  <MapPin className="h-3 w-3" />
                                  <span>지도</span>
                                </button>
                                <button
                                  onClick={() => handlePhoneSearchClick(action.locationName!)}
                                  className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                  title="전화번호 검색"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>전화</span>
                                </button>
                                {links.gov24 && (
                                  <button
                                    onClick={() => handleWebsiteClick(links.gov24!)}
                                    className="flex items-center justify-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
                                    title="정부24 납부하기"
                                  >
                                    <Globe className="h-3 w-3" />
                                    <span>정부24</span>
                                  </button>
                                )}
                                {links.municipalOffice && (
                                  <button
                                    onClick={() => handleWebsiteClick(links.municipalOffice!)}
                                    className="flex items-center justify-center h-7 px-2.5 text-[11px] font-medium text-[#1C2329] hover:text-[#2DB7A3] hover:bg-[#F0F9F7] rounded-md transition-colors border border-gray-200 hover:border-[#2DB7A3]"
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
                            {action.bankAccount?.accountHolder && (
                              <div>
                                <span className="font-medium">예금주:</span> {action.bankAccount.accountHolder}
                              </div>
                            )}
                            {action.bankAccount?.bankName && (
                              <div>
                                <span className="font-medium">은행:</span> {action.bankAccount.bankName}
                              </div>
                            )}
                            {action.bankAccount?.accountNumber && (
                              <div>
                                <span className="font-medium">계좌번호:</span> {action.bankAccount.accountNumber}
                              </div>
                            )}
                            {action.bankAccount?.giroNumber && (
                              <div>
                                <span className="font-medium">지로번호:</span> {action.bankAccount.giroNumber}
                              </div>
                            )}
                            {(!action.bankAccount?.accountHolder && !action.bankAccount?.bankName && 
                              !action.bankAccount?.accountNumber && !action.bankAccount?.giroNumber) && (
                              <div className="text-[#9BA0A7] italic">
                                계좌 정보가 문서에서 추출되지 않았습니다.
                              </div>
                            )}
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

