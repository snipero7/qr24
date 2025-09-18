"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { RefreshCw } from "lucide-react";

export function RegenerateReceiptButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const r = useRouter();
  async function regen() {
    if (loading) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}/receipt/regenerate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل إعادة التوليد');
      try { showToast('تم توليد الإيصال من جديد', 'success'); } catch {}
      r.refresh();
      if (data?.receiptUrl && typeof window !== 'undefined') {
        const openNow = window.confirm('فتح ملف الإيصال الجديد؟');
        if (openNow) {
          const url = `${data.receiptUrl}${data.receiptUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
          window.open(url, '_blank');
        }
      }
    } catch (e: any) {
      try { showToast(e.message || 'فشل إعادة التوليد', 'error'); } catch {}
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      variant="ghost"
      className="icon-ghost"
      title="إعادة توليد الإيصال"
      aria-label="إعادة توليد الإيصال"
      data-label="إعادة توليد الإيصال"
      onClick={regen}
      disabled={loading}
    >
      <RefreshCw size={20} className={loading ? 'animate-spin' : undefined} />
    </Button>
  );
}
