"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Beef,
  Heart,
  Baby,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import type { FarmSettings } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cattle", label: "Cattle", icon: Beef },
  { href: "/breeding", label: "Breeding", icon: Baby },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/finances", label: "Finances", icon: DollarSign },
]

interface SidebarProps {
  settings: FarmSettings
  version: string
  authEnabled: boolean
}

export function Sidebar({ settings, version, authEnabled }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Farm Logo & Name */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sidebar-accent flex items-center justify-center">
          {settings.logoPath ? (
            <Image
              src={`/api/images/${settings.logoPath.split('/').pop()}`}
              alt="Farm logo"
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-sidebar-primary">🐄</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-primary">
            {settings.farmName || "My Farm"}
          </p>
          {settings.ownerName && (
            <p className="truncate text-xs text-sidebar-muted-foreground">{settings.ownerName}</p>
          )}
          <p className="text-[10px] text-sidebar-muted-foreground/50">v{version}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-muted-foreground hover:text-sidebar-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Farm Settings
          </Link>
          <ThemeToggle />
        </div>
        {authEnabled && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-sidebar-muted-foreground transition-colors cursor-pointer hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        )}
      </div>
    </aside>
  )
}
