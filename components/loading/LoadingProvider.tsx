"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { LoadingOverlay } from "@/components/loading/LoadingOverlay"

const LoadingContext = createContext(false)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0)
  const isLoading = activeCount > 0

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
