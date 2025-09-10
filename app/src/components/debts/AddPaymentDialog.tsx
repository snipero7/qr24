"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddPaymentDialog({ debtId }: { debtId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const r = useRouter();

  async function submit() {
    try {
      setLoading(true);
      const res = await fetch(`/api/debts/${debtId}/payments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل إضافة الدفعة');
      setOpen(false);
      r.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={()=>setOpen(true)}>إضافة دفعة</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-[320px] space-y-3">
            <h3 className="font-semibold">دفعة جديدة</h3>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <input type="number" className="border rounded p-2 w-full" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} placeholder="المبلغ" />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1" onClick={()=>setOpen(false)}>إلغاء</button>
              <button disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded" onClick={submit}>{loading?"جارٍ...":"تأكيد"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

