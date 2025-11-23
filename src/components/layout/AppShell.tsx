export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:from-[#0F172A] dark:to-[#1E293B]">
      <main className="container mx-auto px-3 lg:px-4 max-w-7xl pt-16 pb-8">{children}</main>
    </div>
  );
}

