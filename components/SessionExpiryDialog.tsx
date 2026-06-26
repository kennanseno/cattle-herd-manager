"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionExpiry } from "@/lib/useSessionExpiry";

/**
 * Component that displays a confirmation dialog when the session is about to expire.
 * Should be rendered at the root level of the app (in AppShell or layout).
 */
export function SessionExpiryDialog() {
  const { isExpiring, timeLeft, handleContinue, handleLogout } = useSessionExpiry();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsOpen(isExpiring);
  }, [isExpiring]);

  const formatTimeLeft = (ms: number | null): string => {
    if (!ms) return "0:00";
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const onContinue = async () => {
    setIsLoading(true);
    try {
      await handleContinue();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onLogout = async () => {
    setIsLoading(true);
    try {
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTimeLeft(timeLeft)}. Do you want to continue working?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <AlertDialogCancel onClick={onLogout} disabled={isLoading}>
            Logout
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue} disabled={isLoading}>
            {isLoading ? "Continuing..." : "Continue"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
