"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/Sidebar"
import type { FarmSettings } from "@/types"

interface MobileNavProps {
  settings: FarmSettings
  version: string
  authEnabled: boolean
}

// Top bar with a hamburger menu shown only on small screens. Opens the
// sidebar navigation in a slide-out drawer. Hidden on desktop (lg+) where
// the fixed sidebar is used instead.
export function MobileNav({ settings, version, authEnabled }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-sidebar px-4 text-sidebar-foreground lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-lg p-1.5 text-sidebar-foreground transition-colors cursor-pointer hover:bg-sidebar-accent/60"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-sidebar-accent flex items-center justify-center">
          {settings.logoPath ? (
            <Image
              src={`/api/images/${settings.logoPath.split("/").pop()}`}
              alt="Farm logo"
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-sidebar-primary">🐄</span>
          )}
        </div>
        <p className="truncate text-sm font-semibold text-sidebar-primary">
          {settings.farmName || "My Farm"}
        </p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 max-w-[80vw] p-0 [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent
            settings={settings}
            version={version}
            authEnabled={authEnabled}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  )
}
