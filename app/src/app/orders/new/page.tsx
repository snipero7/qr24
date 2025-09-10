"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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
        phone: formData.get("phone") as string,
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
      r.push(`/track/${data.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">طلب جديد</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <form action={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labeled label="اسم العميل"><Input name="name" required /></Labeled>
        <Labeled label="جوال"><Input name="phone" required /></Labeled>
        <Labeled label="نوع الجهاز"><Input name="deviceModel" /></Labeled>
        <Labeled label="IMEI"><Input name="imei" /></Labeled>
        <Labeled label="الخدمة"><Input name="service" required /></Labeled>
        <Labeled label="السعر التقديري"><Input name="originalPrice" type="number" /></Labeled>
        <div className="sm:col-span-2">
          <Labeled label="ملاحظات"><Textarea name="notes" rows={3} /></Labeled>
        </div>
        <div className="sm:col-span-2">
          <Button disabled={loading}>{loading ? "جارٍ الحفظ..." : "حفظ وإنشاء"}</Button>
        </div>
      </form>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm text-gray-600 mb-1">{label}</label>{children}</div>;
}
