"use client";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export function DeliveryNotifier({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [delivered, setDelivered] = useState(initialStatus === "DELIVERED");

  useEffect(() => {
    function onDelivered(e: Event) {
      const ev = e as CustomEvent<{ orderId: string }>;
      if (ev.detail?.orderId === orderId) setDelivered(true);
    }
    window.addEventListener("order-delivered", onDelivered as EventListener);
    return () => window.removeEventListener("order-delivered", onDelivered as EventListener);
  }, [orderId]);

  if (!delivered) return null;
  return <StatusBadge status={"DELIVERED" as any} />;
}

