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
        <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>Loading your farm workspace…</span>
        </div>
      )}
    </div>
  );
}
