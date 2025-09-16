"use client";
import { useState } from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function EditOrderDialog({ order }: { order: { id: string; service: string; deviceModel?: string | null; imei?: string | null; originalPrice: number } }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(order.service);
  const [deviceModel, setDeviceModel] = useState(order.deviceModel || "");
  const [imei, setImei] = useState(order.imei || "");
  const [price, setPrice] = useState(String(Number(order.originalPrice)));
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function save() {
    try {
      setLoading(true);
      const body: any = { service, deviceModel: deviceModel || null, imei: imei || null, originalPrice: Number(price || 0) };
      const res = await fetch(`/api/orders/${order.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل التعديل');
      setOpen(false);
      try { showToast('تم تعديل الطلب', 'success'); } catch {}
      r.refresh();
    } catch (e: any) {
      try { showToast(e.message || 'فشل التعديل', 'error'); } catch {}
    } finally { setLoading(false); }
  }

  return (
    <>
      <button className="icon-ghost" title="تعديل" aria-label="تعديل" onClick={()=>setOpen(true)}>✏️</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="تعديل الطلب" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">الخدمة<Input className="input h-9" value={service} onChange={e=>setService(e.target.value)} /></label>
          <label className="text-sm">الجهاز<Input className="input h-9" value={deviceModel} onChange={e=>setDeviceModel(e.target.value)} /></label>
          <label className="text-sm">IMEI<Input className="input h-9" value={imei} onChange={e=>setImei(e.target.value)} /></label>
          <label className="text-sm">السعر الأساسي<Input className="input h-9" value={price} onChange={e=>setPrice(e.target.value)} /></label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={()=>setOpen(false)}>إلغاء</Button>
          <Button disabled={loading} onClick={save}>{loading?'جارٍ...':'حفظ'}</Button>
        </div>
      </Dialog>
    </>
  );
}
