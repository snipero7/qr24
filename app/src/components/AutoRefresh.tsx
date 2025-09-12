"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    let cronTimer: any;
    function tick() {
      if (document.visibilityState === "visible") router.refresh();
    }
    timer = setInterval(tick, intervalMs);
    async function pingCron() {
      try { await fetch('/api/backup/cron'); } catch {}
    }
    cronTimer = setInterval(() => { if (document.visibilityState === 'visible') pingCron(); }, 5 * 60 * 1000);
    return () => { clearInterval(timer); clearInterval(cronTimer); };
  }, [router, intervalMs]);

  useEffect(() => {
    function onStatus() { router.refresh(); }
    window.addEventListener("order-status-updated", onStatus);
    return () => window.removeEventListener("order-status-updated", onStatus);
  }, [router]);

  return null;
}
