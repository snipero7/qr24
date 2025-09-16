"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/toast";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
  const r = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "فشل الحذف");
      try {
        showToast("تم حذف الطلب", "success");
      } catch {}
      setOpen(false);
      r.push("/orders");
    } catch (e: any) {
      try {
        showToast(e.message || "فشل الحذف", "error");
      } catch {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="icon-ghost text-red-600"
        title="حذف"
        aria-label="حذف"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={20} />
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="حذف الطلب"
        message="سيتم حذف الطلب نهائيًا ولا يمكن التراجع. هل أنت متأكد؟"
        confirmText={loading ? "جارٍ..." : "حذف"}
        cancelText="إلغاء"
        onConfirm={remove}
        loading={loading}
      />
    </>
  );
}
