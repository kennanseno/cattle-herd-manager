import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface SessionMetadata {
  issuedAt: number;
  expiresAt: number;
}

interface UseSessionExpiryReturn {
  isExpired: boolean;
  isExpiring: boolean;
  timeLeft: number | null;
  handleContinue: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

const SESSION_METADATA_COOKIE = "chm_session_meta";
const WARNING_TIME_MS = 2 * 60 * 1000; // Show warning 2 minutes before expiry

/**
 * Hook to manage session expiration and prompt user to extend or logout.
 * Reads session metadata from cookie and tracks time until expiration.
 */
export function useSessionExpiry(): UseSessionExpiryReturn {
  const router = useRouter();
  const [isExpired, setIsExpired] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warningShownRef = useRef(false);

  const getSessionMetadata = useCallback((): SessionMetadata | null => {
    if (typeof document === "undefined") return null;
    
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === SESSION_METADATA_COOKIE) {
        try {
          return JSON.parse(decodeURIComponent(value));
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  const handleContinue = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Update cookie with new expiration time
        const metadata: SessionMetadata = {
          issuedAt: Date.now(),
          expiresAt: data.expiresAt,
        };
        document.cookie = `${SESSION_METADATA_COOKIE}=${encodeURIComponent(JSON.stringify(metadata))}; path=/`;
        setIsExpiring(false);
        setIsExpired(false);
        warningShownRef.current = false;
      } else {
        // Refresh failed, redirect to login
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      router.push("/login");
    }
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
      router.push("/login");
    }
  }, [router]);

  // Check session expiration periodically
  useEffect(() => {
    const check = () => {
      const metadata = getSessionMetadata();
      
      if (!metadata) {
        // No session, likely expired
        setIsExpired(true);
        setIsExpiring(false);
        setTimeLeft(null);
        return;
      }

      const now = Date.now();
      const remaining = metadata.expiresAt - now;

      if (remaining <= 0) {
        // Session expired
        setIsExpired(true);
        setIsExpiring(false);
        setTimeLeft(null);
      } else if (remaining <= WARNING_TIME_MS) {
        // Session expiring soon
        setIsExpiring(true);
        setIsExpired(false);
        setTimeLeft(remaining);
      } else {
        // Session still valid
        setIsExpired(false);
        setIsExpiring(false);
        setTimeLeft(null);
      }
    };

    check();
    checkIntervalRef.current = setInterval(check, 10000); // Check every 10 seconds

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [getSessionMetadata]);

  // Redirect to login if expired
  useEffect(() => {
    if (isExpired) {
      router.push("/login?expired=true");
    }
  }, [isExpired, router]);

  return {
    isExpired,
    isExpiring,
    timeLeft,
    handleContinue,
    handleLogout,
  };
}
