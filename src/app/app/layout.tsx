import { AppShell } from "@/src/components/layout/AppShell";
import { AuthGuard } from "@/src/components/auth/AuthGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

