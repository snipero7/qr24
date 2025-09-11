"use client";
import { useState } from "react";
import { STATUS_LABELS } from "@/lib/statusLabels";
import { useRouter } from "next/navigation";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","CANCELED"] as const;

export function QuickStatus({ orderId, current }: { orderId: string; current: string }) {
  const [to, setTo] = useState(current);
  const [loading, setLoading] = useState(false);
  const r = useRouter();
  const isDelivered = current === 'DELIVERED';

  async function save(next: string) {
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: next }),
      });
      try { window.dispatchEvent(new CustomEvent('order-status-updated')); } catch {}
      r.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1 items-center">
      <select
        className="input h-8 py-0 text-xs"
        value={to}
        onChange={async (e)=>{ const v = e.target.value; setTo(v); await save(v); }}
        disabled={isDelivered || loading}
        title={isDelivered ? 'تم التسليم - تغيير الحالة معطل' : undefined}
      >
        {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      {loading && <span className="text-[10px] text-gray-500">…</span>}
    </div>
  );
}
