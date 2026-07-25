"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import { LoadingOverlay } from "@/components/loading/LoadingOverlay"

const LoadingContext = createContext(false)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0)
  const [navigationActive, setNavigationActive] = useState(false)
  const pathname = usePathname()
  const isLoading = activeCount > 0 || navigationActive

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    const patchFetch = async (input: RequestInfo, init?: RequestInit) => {
      const urlString = typeof input === "string" ? input : input.url
      const resolved = new URL(urlString, window.location.href)
      const isApiRequest =
        resolved.origin === window.location.origin && resolved.pathname.startsWith("/api/")

      if (!isApiRequest) {
        return originalFetch(input, init)
      }

      setActiveCount((count) => count + 1)
      try {
        return await originalFetch(input, init)
      } finally {
        setActiveCount((count) => Math.max(count - 1, 0))
      }
    }

    window.fetch = patchFetch as typeof window.fetch
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    if (!navigationActive) {
      return
    }
    setNavigationActive(false)
  }, [pathname, navigationActive])

  useEffect(() => {
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    const startNavigation = () => {
      Promise.resolve().then(() => setNavigationActive(true))
    }

    window.history.pushState = function (data: any, title: string, url?: string | URL | null) {
      startNavigation()
      return originalPushState.apply(this, [data, title, url])
    }

    window.history.replaceState = function (data: any, title: string, url?: string | URL | null) {
      startNavigation()
      return originalReplaceState.apply(this, [data, title, url])
    }

    const onPopState = () => startNavigation()
    window.addEventListener("popstate", onPopState)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  return (
    <LoadingContext.Provider value={isLoading}>
      {children}
      <LoadingOverlay visible={isLoading} />
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  return useContext(LoadingContext)
}
