"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/toast";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";

type TriggerVariant = "icon" | "pill";

export default function DeleteOrderButton({ orderId, variant = "icon" }: { orderId: string; variant?: TriggerVariant }) {
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

  const isPill = variant === "pill";
  const iconSize = isPill ? 18 : 22;

  return (
    <>
      <button
        type="button"
        className={isPill ? "action-pill action-pill--danger" : "icon-ghost text-red-600"}
        title="حذف"
        aria-label="حذف"
        data-label={isPill ? undefined : "حذف"}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={iconSize} />
        {isPill ? <span>حذف</span> : null}
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
