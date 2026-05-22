"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
      <Toaster richColors closeButton />
    </NextThemesProvider>
  )
}
