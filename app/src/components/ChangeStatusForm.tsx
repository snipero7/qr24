"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","CANCELED"] as const; // DELIVERED عبر مسار التسليم

export function ChangeStatusForm({ orderId, current }: { orderId: string; current: string }) {
  const [to, setTo] = useState<string>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        <select className="border rounded p-2" value={to} onChange={(e)=>setTo(e.target.value)}>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">ملاحظة</label>
        <input className="border rounded p-2 w-full" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="اختياري" />
      </div>
      <button disabled={loading} className="btn-primary">حفظ</button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </form>
  );
}
