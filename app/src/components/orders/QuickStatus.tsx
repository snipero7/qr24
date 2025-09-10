"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","CANCELED"] as const;

export function QuickStatus({ orderId, current }: { orderId: string; current: string }) {
  const [to, setTo] = useState(current);
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function save() {
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      r.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1 items-center">
      <select className="border rounded p-1 text-xs" value={to} onChange={(e)=>setTo(e.target.value)}>
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button disabled={loading} onClick={save} className="border rounded px-2 text-xs">حفظ</button>
    </div>
  );
}

