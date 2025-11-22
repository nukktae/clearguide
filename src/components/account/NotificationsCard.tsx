"use client";

import * as React from "react";
import { Card, CardContent } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Checkbox } from "@/src/components/common/Checkbox";
import { Bell, Calendar as CalendarIcon } from "lucide-react";

interface NotificationsCardProps {
  deadlineAlerts: boolean;
  onDeadlineAlertsChange: (enabled: boolean) => void;
  calendarReminders: boolean;
  onCalendarRemindersChange: (enabled: boolean) => void;
  analysisReady: boolean;
  onAnalysisReadyChange: (enabled: boolean) => void;
  weeklyReport: boolean;
  onWeeklyReportChange: (enabled: boolean) => void;
  autoSyncDeadlines: boolean;
  onAutoSyncDeadlinesChange: (enabled: boolean) => void;
}

export function NotificationsCard({
  deadlineAlerts,
  onDeadlineAlertsChange,
  calendarReminders,
  onCalendarRemindersChange,
  analysisReady,
  onAnalysisReadyChange,
  weeklyReport,
  onWeeklyReportChange,
  autoSyncDeadlines,
  onAutoSyncDeadlinesChange,
}: NotificationsCardProps) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardContent className="p-6 space-y-6">
        {/* Notification Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-[#1A1A1A] dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
            알림 설정
          </h4>
          <div className="space-y-2 ml-7">
            <Checkbox
              checked={deadlineAlerts}
              onChange={(e) => onDeadlineAlertsChange(e.target.checked)}
              label="문서 마감일"
            />
            <Checkbox
              checked={calendarReminders}
              onChange={(e) => onCalendarRemindersChange(e.target.checked)}
              label="캘린더 동기화"
            />
            <Checkbox
              checked={analysisReady}
              onChange={(e) => onAnalysisReadyChange(e.target.checked)}
              label="분석 완료 알림"
            />
            <Checkbox
              checked={weeklyReport}
              onChange={(e) => onWeeklyReportChange(e.target.checked)}
              label="주간 리포트"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Calendar Sync */}
          <div className="space-y-3">
            <h4 className="font-medium text-[#1A1A1A] dark:text-gray-100 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#6D6D6D] dark:text-gray-400" />
              캘린더 동기화
            </h4>
            <div className="space-y-2 ml-7">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">Google Calendar</span>
                <Button variant="outline" size="sm">
                  연결
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">Apple Calendar</span>
                <Button variant="outline" size="sm">
                  연결
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6D6D6D] dark:text-gray-400">Naver Calendar</span>
                <Button variant="outline" size="sm">
                  연결
                </Button>
              </div>
              <div className="pt-2">
                <Checkbox
                  checked={autoSyncDeadlines}
                  onChange={(e) => onAutoSyncDeadlinesChange(e.target.checked)}
                  label="마감일 자동 동기화"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

