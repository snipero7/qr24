"use client";
import { useState } from "react";
import { STATUS_LABELS } from "@/lib/statusLabels";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","CANCELED"] as const; // DELIVERED عبر مسار التسليم

export function ChangeStatusForm({ orderId, current }: { orderId: string; current: string }) {
  const [to, setTo] = useState<string>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const r = useRouter();
  const isDelivered = current === 'DELIVERED';

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل تحديث الحالة");
      try { window.dispatchEvent(new CustomEvent('order-status-updated')); } catch {}
      r.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-end">
      <div>
        <label className="block text-sm text-gray-600 mb-1">الحالة</label>
        <select className="input h-9 py-0 disabled:opacity-50" value={to} onChange={(e)=>{ setTo(e.target.value); submit(); }} disabled={isDelivered} title={isDelivered ? 'تم التسليم - تغيير الحالة معطل' : undefined}>
          {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">ملاحظة</label>
        <input className="input w-full h-9" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="اختياري" disabled={isDelivered} />
      </div>
      <button
        disabled={loading || isDelivered}
        className="icon-ghost disabled:opacity-50"
        title={isDelivered ? 'تم التسليم' : 'حفظ'}
        aria-label={isDelivered ? 'تم التسليم' : 'حفظ'}
      >
        <Save size={24} />
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </form>
  );
}
