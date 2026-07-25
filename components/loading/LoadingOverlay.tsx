"use client"

import { Loader2 } from "lucide-react"

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) {
    return null
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-3 text-sm font-medium text-foreground shadow-lg ring-1 ring-border">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </div>
  )
}
