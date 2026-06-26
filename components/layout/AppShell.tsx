"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { FarmSettings } from "@/types";

// Renders the app chrome (sidebar) for normal pages, but a bare full-screen
// container for the login screen so the gate has no navigation around it.
export function AppShell({
  settings,
  version,
  children,
}: {
  settings: FarmSettings;
  version: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="flex-1 overflow-y-auto">{children}</main>;
  }

  return (
    <>
      <Sidebar settings={settings} version={version} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </>
  );
}
