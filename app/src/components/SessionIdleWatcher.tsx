"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const LAST_ACTIVE_KEY = "qr24:last-active";
const SIGN_OUT_BROADCAST_KEY = "qr24:sign-out";
const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function safeNow() {
  return Date.now();
}

function readLastActive(): number {
  try {
    const stored = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!stored) return safeNow();
    const value = Number(stored);
    return Number.isFinite(value) ? value : safeNow();
  } catch {
    return safeNow();
  }
}

function writeLastActive(timestamp: number) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(timestamp));
  } catch {
    /* ignore */
  }
}

function broadcastSignOut() {
  try {
    localStorage.setItem(SIGN_OUT_BROADCAST_KEY, String(safeNow()));
  } catch {
    /* ignore */
  }
}

export default function SessionIdleWatcher({ timeoutMs = DEFAULT_TIMEOUT }: { timeoutMs?: number }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOutRef = useRef(false);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function triggerSignOut() {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      clearTimer();
      broadcastSignOut();
      try {
        localStorage.removeItem(LAST_ACTIVE_KEY);
      } catch {
        /* ignore */
      }
      signOut({ callbackUrl: "/signin?reason=timeout" });
    }

    function scheduleCheck() {
      clearTimer();
      const lastActive = readLastActive();
      const diff = safeNow() - lastActive;
      if (diff >= timeoutMs) {
        triggerSignOut();
        return;
      }
      const remaining = Math.max(1000, timeoutMs - diff);
      timerRef.current = setTimeout(checkIdle, remaining);
    }

    function checkIdle() {
      const lastActive = readLastActive();
      if (safeNow() - lastActive >= timeoutMs) {
        triggerSignOut();
        return;
      }
      scheduleCheck();
    }

    function recordActivity() {
      if (signingOutRef.current) return;
      writeLastActive(safeNow());
      scheduleCheck();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        recordActivity();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === SIGN_OUT_BROADCAST_KEY && !signingOutRef.current) {
        signingOutRef.current = true;
        clearTimer();
        signOut({ callbackUrl: "/signin?reason=timeout" });
      }
      if (event.key === LAST_ACTIVE_KEY && !signingOutRef.current) {
        scheduleCheck();
      }
    }

    // Initial check in case the tab was reopened after being idle
    const lastActive = readLastActive();
    if (safeNow() - lastActive >= timeoutMs) {
      triggerSignOut();
    } else {
      recordActivity();
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "wheel",
    ];

    const handleBeforeUnload = () => {
      writeLastActive(safeNow());
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener("focus", recordActivity);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("storage", handleStorage);

    return () => {
      signingOutRef.current = false;
      clearTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener("focus", recordActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("storage", handleStorage);
    };
  }, [timeoutMs]);

  return null;
}
