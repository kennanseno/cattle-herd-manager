"use client";

import { useState } from "react";
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

export function SessionExpiryDialog() {
  const { isExpiring, timeLeft, handleContinue, handleLogout } = useSessionExpiry();
  const [isLoading, setIsLoading] = useState(false);

  const formatTimeLeft = (ms: number | null): string => {
    if (ms === null) return "0:00";
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const onContinue = async () => {
    setIsLoading(true);
    try {
      await handleContinue();
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
    <AlertDialog open={isExpiring} onOpenChange={() => undefined}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTimeLeft(timeLeft)}. Do you want to continue working?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              void onLogout();
            }}
          >
            Logout
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              void onContinue();
            }}
          >
            {isLoading ? "Continuing..." : "Continue"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
