"use client";

import { Sprout } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Loading() {
  const pathname = usePathname();
  const isPublicPage = ["/", "/login", "/register"].includes(pathname);

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-6 py-12">
      {isPublicPage ? (
        <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-5 text-lg font-semibold tracking-tight">Cattle Herd Manager</p>
          <p className="mt-1 text-sm text-muted-foreground">A steadier view of farm life</p>
          <span
            className="mt-7 h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="sr-only">Loading page…</span>
        </div>
      ) : (
        <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center py-10 sm:px-6">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card px-8 py-10 text-center shadow-xl shadow-primary/5 sm:px-12 sm:py-12"
            role="status"
            aria-live="polite"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent"
              aria-hidden="true"
            />
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <span
                className="absolute inset-1 rounded-full border-2 border-primary/15 border-t-primary/80 motion-safe:animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Sprout className="h-8 w-8" aria-hidden="true" />
              </span>
              <span className="absolute right-1 top-3 h-2.5 w-2.5 rounded-full bg-primary/50 motion-safe:animate-pulse" aria-hidden="true" />
              <span className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-primary/30 motion-safe:animate-pulse motion-safe:[animation-delay:300ms]" aria-hidden="true" />
            </div>
            <p className="relative mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Cattle Herd Manager
            </p>
            <h1 className="relative mt-2 text-2xl font-semibold tracking-tight">
              Getting your farm ready
            </h1>
            <p className="relative mt-2 text-sm leading-6 text-muted-foreground">
              Gathering your herd records and workspace.
            </p>
            <div className="relative mx-auto mt-7 flex items-center justify-center gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/50 motion-safe:animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 motion-safe:animate-bounce motion-safe:[animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-bounce motion-safe:[animation-delay:300ms]" />
            </div>
            <span className="sr-only">Loading your farm workspace…</span>
          </div>
        </div>
      )}
    </div>
  );
}
