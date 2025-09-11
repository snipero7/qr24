"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { AmountPad } from "@/components/ui/amount-pad";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function AddPaymentDialog({ debtId, variant = "text" }: { debtId: string; variant?: "text" | "icon" }) {
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
      {variant === "icon" ? (
        <button
          type="button"
          onClick={()=>setOpen(true)}
          title="سداد"
          className="icon-ghost"
        >
          <Wallet className="w-5 h-5 text-[var(--color-primary)] dark:text-[var(--color-primary)]" />
        </button>
      ) : (
        <Button size="sm" onClick={()=>setOpen(true)}>سداد</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="سداد" />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <AmountPad name="amount" label="المبلغ" onChangeValue={(n)=>setAmount(n)} />
        <div className="flex gap-2 justify-end mt-3">
          <Button variant="outline" size="md" className="h-12 px-5" onClick={()=>setOpen(false)}>إلغاء</Button>
          <Button disabled={loading} size="lg" className="h-14 sm:h-12 px-6" onClick={submit}>{loading?"جارٍ...":"تأكيد"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
