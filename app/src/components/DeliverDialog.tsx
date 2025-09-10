"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DeliverDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const r = useRouter();

  async function submit() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectedPrice: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل التسليم");
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
      <Button variant="default" size="sm" onClick={() => setOpen(true)}>تسليم</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="تحصيل وتسليم" />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <Input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} placeholder="المبلغ المُحصّل" />
        <div className="flex gap-2 justify-end mt-3">
          <Button variant="outline" size="sm" onClick={()=>setOpen(false)}>إلغاء</Button>
          <Button disabled={loading} size="sm" onClick={submit}>{loading?"جارٍ...":"تأكيد"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
