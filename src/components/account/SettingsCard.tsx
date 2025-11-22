import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/common/Card";

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className,
}: SettingsCardProps) {
  return (
    <Card className={className}>
      {description ? (
        <>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </>
      ) : (
        <CardContent className="p-6">{children}</CardContent>
      )}
    </Card>
  );
}

