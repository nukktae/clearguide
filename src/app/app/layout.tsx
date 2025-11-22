import { AppShell } from "@/src/components/layout/AppShell";
import { AuthGuard } from "@/src/components/auth/AuthGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[AppLayout] Rendering app layout");
  console.log("[AppLayout] Children:", children);
  try {
    return (
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    );
  } catch (error) {
    console.error("[AppLayout] Error:", error);
    throw error;
  }
}

