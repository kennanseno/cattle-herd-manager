"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { LoadingProvider } from "@/components/loading/LoadingProvider"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <LoadingProvider>
        {children}
        <Toaster richColors closeButton />
      </LoadingProvider>
    </NextThemesProvider>
  )
}
