"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AmountPad } from "@/components/ui/amount-pad";
import { normalizeNumberInput } from "@/lib/utils";
import { showToast } from "@/components/ui/toast";

export default function NewOrderPage() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
      const payload = {
        customer: {
          name: formData.get("name") as string,
          phone: normalizeNumberInput(String(formData.get("phone") || "")),
          notes: (formData.get("notes") as string) || undefined,
        },
      deviceModel: (formData.get("deviceModel") as string) || undefined,
      imei: (formData.get("imei") as string) || undefined,
      service: formData.get("service") as string,
      originalPrice: Number(formData.get("originalPrice") || 0),
    };
    try {
      const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل إنشاء الطلب");
      try { showToast("تم إنشاء الطلب بنجاح", "success"); } catch {}
      r.push(`/track/${data.code}`);
    } catch (e: any) {
      setError(e.message);
      try { showToast(e.message || "فشل إنشاء الطلب", "error"); } catch {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">طلب جديد</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <form action={onSubmit} className="card tonal">
        <div className="card-header">
          <h2 className="card-title">بيانات الطلب</h2>
        </div>
        <div className="card-section grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Labeled label="اسم العميل"><Input name="name" required /></Labeled>
          <Labeled label="جوال"><Input name="phone" required /></Labeled>
          <Labeled label="نوع الجهاز"><Input name="deviceModel" /></Labeled>
          <Labeled label="IMEI"><Input name="imei" /></Labeled>
          <Labeled label="الخدمة"><Input name="service" required /></Labeled>
          <div>
            <AmountPad name="originalPrice" label="السعر" />
          </div>
          <div className="sm:col-span-2">
            <Labeled label="ملاحظات"><Textarea name="notes" rows={3} /></Labeled>
          </div>
        </div>
        <div className="card-footer">
          <Button
            disabled={loading}
            title={loading ? "جارٍ الحفظ..." : "حفظ وإنشاء"}
            aria-label={loading ? "جارٍ الحفظ..." : "حفظ وإنشاء"}
            className="icon-ghost"
          >
            <Save size={24} />
          </Button>
        </div>
      </form>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm text-gray-600 mb-1">{label}</label>{children}</div>;
}
