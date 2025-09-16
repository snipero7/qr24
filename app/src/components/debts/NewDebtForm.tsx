"use client";
import { useRef, useState } from "react";
import { AmountPad } from "@/components/ui/amount-pad";
import { PhoneInput } from "@/components/ui/phone-input";
import { FileDown, PlusCircle } from "lucide-react";
import { normalizeNumberInput, toLatinDigits } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ShopRef = { shopName: string; phone?: string | null };

export default function NewDebtForm({ shops, action }: { shops: ShopRef[]; action: (formData: FormData) => Promise<void> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [padKey, setPadKey] = useState(0);

  async function clientAction(fd: FormData) {
    await action(fd);
    // Clear fields after successful add
    setName("");
    setPhone("");
    formRef.current?.reset();
    setPadKey((k)=>k+1);
  }

  function onChooseShop(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = Number(e.target.value);
    if (isNaN(idx) || idx < 0) return;
    const s = shops[idx];
    if (s) {
      setName(s.shopName);
      setPhone(normalizeNumberInput(s.phone || ""));
    }
  }

  return (
    <form ref={formRef} action={clientAction} className="card tonal interactive">
      <div className="card-header">
        <div>
          <div className="card-subtitle">إدارة الديون</div>
          <h3 className="card-title">دين جديد</h3>
        </div>
        <a
          href="/api/debts/export"
          title="تصدير CSV"
          aria-label="تصدير CSV"
          className="icon-ghost"
        >
          <FileDown size={24} />
          <span className="sr-only">تصدير</span>
        </a>
      </div>

      <div className="card-section grid grid-cols-1 sm:grid-cols-6 gap-3">
      <div className="sm:col-span-6 flex items-center gap-2">
        <label className="text-sm text-gray-600">محل موجود:</label>
        <select
          onChange={onChooseShop}
          className="input w-full sm:w-auto bg-white shadow-sm"
        >
          <option value="">— اختر —</option>
          {shops.map((s, i) => (
            <option key={`${s.shopName}-${s.phone ?? ''}`} value={i}>{s.shopName}{s.phone ? ` (${toLatinDigits(s.phone)})` : ''}</option>
          ))}
        </select>
      </div>

      <Input
        name="shopName"
        required
        placeholder="اسم المحل"
        className="input bg-white shadow-sm"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />
      <PhoneInput
        name="phone"
        placeholder="جوال المحل"
        className="input bg-white shadow-sm"
        value={phone}
        onChange={(e)=>setPhone(e.target.value)}
      />
      <Input
        name="service"
        required
        placeholder="الخدمة"
        className="input bg-white shadow-sm"
      />
      <div className="sm:col-span-2">
        <AmountPad
          key={padKey}
          name="amount"
          label="المبلغ"
          className="rounded-xl p-2 bg-white shadow-sm border border-black/10 dark:border-white/10"
        />
      </div>
      <Input name="notes" placeholder="ملاحظات" className="input bg-white shadow-sm" />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          title="إضافة دين"
          aria-label="إضافة دين"
          className="icon-ghost"
        >
          <PlusCircle className="w-5 h-5 text-[var(--color-primary)] dark:text-[var(--color-primary)]" />
        </button>
      </div>
      </div>
    </form>
  );
}
