"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionExpiryDialog } from "@/components/SessionExpiryDialog";
import type { FarmSettings } from "@/types";

// Renders the app chrome (sidebar) for normal pages, but a bare full-screen
// container for the login screen so the gate has no navigation around it.
export function AppShell({
  settings,
  version,
  authEnabled,
  children,
}: {
  settings: FarmSettings;
  version: string;
  authEnabled: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="flex-1 overflow-y-auto">{children}</main>;
  }

  return (
    <>
      <Sidebar settings={settings} version={version} authEnabled={authEnabled} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileNav settings={settings} version={version} authEnabled={authEnabled} />
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="min-h-full animate-page-enter">
            {children}
          </div>
        </main>
      </div>
      {authEnabled && <SessionExpiryDialog />}
    </>
  );
}
