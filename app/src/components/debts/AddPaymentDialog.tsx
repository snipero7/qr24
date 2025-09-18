"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { AmountPad } from "@/components/ui/amount-pad";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { showToast } from "@/components/ui/toast";

type Props = {
  debtId: string;
  variant?: "text" | "icon";
  onOpenChange?: (open: boolean) => void;
};

export function AddPaymentDialog({ debtId, variant = "text", onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const r = useRouter();

  function toggle(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  async function submit() {
    try {
      setLoading(true);
      const res = await fetch(`/api/debts/${debtId}/payments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل إضافة الدفعة');
      setOpen(false);
      try { showToast("تمت إضافة الدفعة", "success"); } catch {}
      r.refresh();
    } catch (e: any) {
      setError(e.message);
      try { showToast(e.message || 'فشل إضافة الدفعة', 'error'); } catch {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={()=>toggle(true)}
          title="سداد"
          aria-label="سداد"
          className="icon-ghost"
        >
          <Wallet className="w-5 h-5 text-[var(--color-primary)] dark:text-[var(--color-primary)]" />
        </button>
      ) : (
        <Button size="sm" onClick={()=>toggle(true)}>سداد</Button>
      )}
      <Dialog open={open} onOpenChange={toggle}>
        <DialogHeader title="سداد" />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <AmountPad name="amount" label="المبلغ" onChangeValue={(n)=>setAmount(n)} closeOnOutsideClick={false} />
        <div className="flex gap-2 justify-end mt-3">
          <Button variant="outline" size="md" className="h-12 px-5" onClick={()=>toggle(false)}>إلغاء</Button>
          <Button disabled={loading} size="lg" className="h-14 sm:h-12 px-6" onClick={submit}>{loading?"جارٍ...":"تأكيد"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
