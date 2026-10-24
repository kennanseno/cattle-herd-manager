"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  parseSessionMetadata,
  SESSION_METADATA_COOKIE,
  SESSION_WARNING_TIME_MS,
} from "@/lib/session-expiry";

interface UseSessionExpiryReturn {
  isExpiring: boolean;
  timeLeft: number | null;
  handleContinue: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

function getSessionMetadata() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${SESSION_METADATA_COOKIE}=`));
  return parseSessionMetadata(cookie?.slice(SESSION_METADATA_COOKIE.length + 1));
}

function getLoginUrl(expired: boolean) {
  const current = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();
  if (expired) params.set("expired", "true");
  if (current.startsWith("/") && !current.startsWith("/login")) {
    params.set("from", current);
  }
  return `/login${params.size ? `?${params.toString()}` : ""}`;
}

export function useSessionExpiry(): UseSessionExpiryReturn {
  const router = useRouter();
  const [isExpiring, setIsExpiring] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const expiringRef = useRef(false);
  const expiryRequestRef = useRef(false);

  const expireSession = useCallback(async () => {
    if (expiryRequestRef.current) return;
    expiryRequestRef.current = true;
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        toast.error("Your session expired, but we couldn't end it cleanly. Please sign in again.");
      }
    } catch {
      toast.error("Your session expired. Please sign in again.");
    } finally {
      router.replace(getLoginUrl(true));
    }
  }, [router]);

  const handleContinue = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" });
      if (!response.ok) {
        toast.error("Your session could not be renewed. Please log in again.");
        await expireSession();
        return;
      }
      setIsExpiring(false);
      expiringRef.current = false;
      setTimeLeft(null);
    } catch {
      toast.error("We couldn't reach the session service. Please log in again.");
      await expireSession();
    }
  }, [expireSession]);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        toast.error("We couldn't end your session. Please try again.");
        return;
      }
      router.replace("/login");
    } catch {
      toast.error("We couldn't reach the session service. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    const checkSession = () => {
      const metadata = getSessionMetadata();
      if (!metadata) return;

      const remaining = metadata.expiresAt - Date.now();
      if (remaining <= 0) {
        setIsExpiring(false);
        setTimeLeft(null);
        void expireSession();
        return;
      }

      const shouldWarn = remaining <= SESSION_WARNING_TIME_MS;
      if (shouldWarn !== expiringRef.current) {
        expiringRef.current = shouldWarn;
        setIsExpiring(shouldWarn);
      }
      setTimeLeft(shouldWarn ? remaining : null);
    };

    checkSession();
    const interval = window.setInterval(checkSession, 1000);
    return () => window.clearInterval(interval);
  }, [expireSession]);

  return { isExpiring, timeLeft, handleContinue, handleLogout };
}
