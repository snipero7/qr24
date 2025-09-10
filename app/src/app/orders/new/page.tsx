"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <Input name="name" label="اسم العميل" required />
        <Input name="phone" label="جوال" required />
        <Input name="deviceModel" label="نوع الجهاز" />
        <Input name="imei" label="IMEI" />
        <Input name="service" label="الخدمة" required />
        <Input name="originalPrice" label="السعر التقديري" type="number" />
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">ملاحظات</label>
          <textarea name="notes" className="w-full border rounded p-2" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <button disabled={loading} className="rounded bg-blue-600 text-white px-4 py-2">
            {loading ? "جارٍ الحفظ..." : "حفظ وإنشاء"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input(props: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1" htmlFor={props.name}>{props.label}</label>
      <input id={props.name} name={props.name} type={props.type || "text"} required={props.required}
             className="w-full border rounded p-2" />
    </div>
  );
}

