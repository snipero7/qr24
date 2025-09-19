"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { normalizeNumberInput } from "@/lib/utils";
import { HandCoins, Check } from "lucide-react";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import { templates, storeConfig } from "@/config/notifications";

type TriggerVariant = "icon" | "pill";

export function DeliverDialog({
  orderId,
  defaultAmount,
  phone,
  customerName,
  variant = "icon",
}: {
  orderId: string;
  defaultAmount?: number;
  phone?: string | null;
  customerName?: string;
  variant?: TriggerVariant;
}) {
  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState<string>("");
  const [extraStr, setExtraStr] = useState<string>("");
  const [extraReason, setExtraReason] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'TRANSFER'>('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const r = useRouter();
  const [discountApplied, setDiscountApplied] = useState(0);
  const [prevRequired, setPrevRequired] = useState<number>(0);

  useEffect(() => {
    if (open) {
      const init = typeof defaultAmount === 'number' && !isNaN(defaultAmount) ? defaultAmount : 0;
      setAmountStr(init > 0 ? String(Number(init.toFixed(2))) : "");
      setExtraStr("");
      setExtraReason("");
      setDiscountApplied(0);
      setPrevRequired(Number(init.toFixed(2)));
      setError(null);
    }
  }, [open, defaultAmount]);

  const amount = useMemo(() => {
    const n = Number(amountStr);
    return isNaN(n) ? 0 : n;
  }, [amountStr]);

  const extra = useMemo(() => {
    const n = Number(extraStr);
    return isNaN(n) ? 0 : Math.max(0, Number(n.toFixed(2)));
  }, [extraStr]);

  // Auto-calc discount: (base + extra) - amount
  useEffect(() => {
    const base = (typeof defaultAmount === 'number' && defaultAmount > 0) ? defaultAmount : 0;
    const extra = Number(extraStr || 0);
    const effective = Math.max(0, base + (isNaN(extra) ? 0 : extra));
    if (effective > 0) {
      const d = Math.max(0, Number((effective - amount).toFixed(2)));
      setDiscountApplied(d);
    } else {
      setDiscountApplied(0);
    }
  }, [amount, defaultAmount, extraStr]);

  const requiredAmount = useMemo(() => {
    const base = (typeof defaultAmount === 'number' && defaultAmount > 0) ? defaultAmount : 0;
    return Number(Math.max(0, base + extra).toFixed(2));
  }, [defaultAmount, extra]);

  // When required amount changes due to extra charge edits, auto-sync amount if user didn't override
  useEffect(() => {
    const current = Number(Number(amountStr || 0).toFixed(2));
    if (!amountStr || current === prevRequired) {
      setAmountStr(String(requiredAmount.toFixed(2)));
    }
    setPrevRequired(requiredAmount);
  }, [requiredAmount]);

  async function submit() {
    try {
      setLoading(true);
      setError(null);
      const payloadAmount = Number(amount.toFixed(2));
      if (!(payloadAmount > 0)) { setError('أدخل مبلغًا صالحًا'); setLoading(false); return; }
      const extra = Number(Number(extraStr || 0).toFixed(2));
      if (extra > 0 && (!extraReason || !extraReason.trim())) {
        setError('يجب إدخال سبب للرسوم الإضافية');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectedPrice: payloadAmount, extraCharge: extra, extraReason: extraReason || undefined, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || "فشل التسليم";
        const code = data?.code ? ` (${data.code})` : '';
        throw new Error(`${msg}${code}`);
      }
      try {
        window.dispatchEvent(new CustomEvent('order-delivered', { detail: { orderId } }));
        window.dispatchEvent(new CustomEvent('order-status-updated'));
      } catch {}
      setOpen(false);
      try { showToast("تم التسليم وتسجيل التحصيل", "success"); } catch {}
      // Ask to open WhatsApp with delivered receipt message
      try {
        if (phone && customerName) {
          const originalPrice = typeof defaultAmount === 'number' ? defaultAmount : amount;
          const extra = Number(extraStr || 0);
          const effective = Math.max(0, Number((originalPrice + (isNaN(extra) ? 0 : extra)).toFixed(2)));
          const discount = Math.max(0, Number((effective - amount).toFixed(2)));
          const href = buildWhatsAppLink(
            phone,
            templates['order.delivered'],
            { customerName, collectedPrice: payloadAmount, originalPrice: effective, discount, receiptUrl: data?.receiptUrl || '', extraCharge: extra || 0, extraReason: extraReason || '', ...storeConfig }
          );
          if (href) {
            const proceed = window.confirm('فتح واتساب لإرسال الإيصال الآن؟');
            if (proceed) window.open(href, '_blank');
          }
        }
      } catch {}
      r.refresh();
    } catch (e: any) {
      setError(e.message);
      try { showToast(e.message || "فشل التسليم", "error"); } catch {}
    } finally {
      setLoading(false);
    }
  }

  function append(val: string) {
    setAmountStr((prev) => {
      if (val === ".") {
        if (!prev) return "0.";
        if (prev.includes(".")) return prev;
        return prev + ".";
      }
      // digits
      if (prev === "0") return val; // replace leading zero
      // limit to 2 decimals
      if (prev.includes(".")) {
        const [, dec] = prev.split(".");
        if (dec.length >= 2) return prev;
      }
      return prev + val;
    });
  }

  function backspace() {
    setAmountStr((p) => p.slice(0, -1));
  }

  function clearAll() {
    setAmountStr("");
    setDiscountApplied(0);
  }

  function setQuick(n: number) {
    setAmountStr(String(Number(n.toFixed(2))));
    setDiscountApplied(0);
  }

  function applyDiscountValue(v: number) {
    const base = (typeof defaultAmount === 'number' && defaultAmount > 0) ? defaultAmount : amount;
    const extra = Number(extraStr || 0);
    const eff = Math.max(0, base + (isNaN(extra) ? 0 : extra));
    const next = Math.max(0, eff - v);
    setAmountStr(String(Number(next.toFixed(2))));
    setDiscountApplied(Math.max(0, eff - next));
  }

  function applyDiscountPercent(p: number) {
    const base = (typeof defaultAmount === 'number' && defaultAmount > 0) ? defaultAmount : amount;
    const extra = Number(extraStr || 0);
    const eff = Math.max(0, base + (isNaN(extra) ? 0 : extra));
    const v = (eff * p) / 100;
    const next = Math.max(0, eff - v);
    setAmountStr(String(Number(next.toFixed(2))));
    setDiscountApplied(Math.max(0, eff - next));
  }

  const isPill = variant === "pill";
  const iconSize = isPill ? 18 : 22;

  return (
    <div>
      <button
        type="button"
        className={isPill ? "action-pill action-pill--success" : "icon-ghost"}
        title="تسليم"
        aria-label="تسليم"
        data-label={isPill ? undefined : "تسليم"}
        onClick={() => setOpen(true)}
      >
        <HandCoins size={iconSize} />
        {isPill ? <span>تسليم</span> : null}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="تحصيل وتسليم" />
        {error && (
          <div className="text-sm mb-2 rounded border border-red-200 bg-red-50 text-red-700 px-2 py-1">
            {error}
          </div>
        )}

        {/* Display */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">بعد الخصم</div>
              <div className="text-xs text-gray-500 mt-0.5">المطلوب: {requiredAmount.toFixed(2)} ر.س</div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{(amount > 0 ? amount.toFixed(2) : "0.00")} ر.س</div>
          </div>
          <div className="mt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">الخصم</span>
              <span className={discountApplied > 0 ? "text-red-600 dark:text-red-400 tabular-nums" : "text-gray-500 tabular-nums"}>
                {discountApplied > 0 ? `-${discountApplied.toFixed(2)}` : "0.00"} ر.س
              </span>
            </div>
            {extra > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-600">يتضمن رسوم إضافية{extraReason ? ` (${extraReason})` : ''}</span>
                <span className="tabular-nums">+{extra.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="mt-2 text-[11px] text-gray-500">
              المعادلة: السعر الأساسي + الإضافات − الخصم = <b className="tabular-nums">{amount.toFixed(2)}</b> ر.س
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Button variant="outline" onClick={() => setQuick(requiredAmount)}>المطلوب</Button>
          <Button variant="outline" onClick={() => setQuick(amount + 5)}>+5</Button>
          <Button variant="outline" onClick={() => setQuick(amount + 10)}>+10</Button>
          <Button variant="outline" onClick={() => setQuick(amount + 50)}>+50</Button>
        </div>

        {/* Discounts */}
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">الخصم</div>
          <div className="grid grid-cols-6 gap-2">
            <Button variant="outline" onClick={() => applyDiscountValue(5)}>-5 ر.س</Button>
            <Button variant="outline" onClick={() => applyDiscountValue(10)}>-10</Button>
            <Button variant="outline" onClick={() => applyDiscountValue(20)}>-20</Button>
            <Button variant="outline" onClick={() => applyDiscountPercent(5)}>-5%</Button>
            <Button variant="outline" onClick={() => applyDiscountPercent(10)}>-10%</Button>
            <Button variant="outline" onClick={() => applyDiscountPercent(15)}>-15%</Button>
          </div>
          {discountApplied > 0 && (
            <div className="mt-2 text-xs text-gray-600">الخصم المطبّق: {discountApplied.toFixed(2)} ر.س</div>
          )}
        </div>

        {/* Extra charges */}
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">رسوم إضافية (اختياري)</div>
          <div className="grid grid-cols-6 gap-2">
            <Input
              inputMode="decimal"
              type="text"
              step="0.5"
              min="0"
              placeholder="مثال: 40.5"
              title="يتم تحويل الأرقام تلقائيًا إلى الإنجليزية"
              className="input h-9 col-span-2"
              value={extraStr}
              onChange={(e)=>{
                const norm = normalizeNumberInput(e.target.value);
                setExtraStr(norm);
              }}
            />
            <Input
              type="text"
              placeholder="سبب الرسوم (قطعة إضافية...)"
              className="input h-9 col-span-4"
              value={extraReason}
              onChange={(e)=>setExtraReason(e.target.value)}
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">وسيلة الدفع</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="payment"
                className="accent-emerald-600"
                checked={paymentMethod === 'CASH'}
                onChange={() => setPaymentMethod('CASH')}
              />
              <span>نقدًا</span>
            </label>
            <label className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="payment"
                className="accent-emerald-600"
                checked={paymentMethod === 'TRANSFER'}
                onChange={() => setPaymentMethod('TRANSFER')}
              />
              <span>تحويل</span>
            </label>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {["7","8","9","4","5","6","1","2","3"].map((k) => (
            <Button key={k} variant="outline" className="h-12 text-lg" onClick={() => append(k)}>{k}</Button>
          ))}
          <Button variant="outline" className="h-12 text-lg" onClick={() => append("0")}>0</Button>
          <Button variant="outline" className="h-12 text-lg" onClick={() => append(".")}>.</Button>
          <Button variant="outline" className="h-12 text-lg" onClick={backspace}>⌫</Button>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" size="md" className="h-10 px-4" onClick={clearAll}>مسح</Button>
          <Button variant="outline" size="md" className="h-10 px-4" onClick={()=>setOpen(false)}>إلغاء</Button>
          <Button
            disabled={loading || amount <= 0}
            className="icon-ghost"
            title={`تأكيد (${amount.toFixed(2)} ر.س)`}
            aria-label={`تأكيد (${amount.toFixed(2)} ر.س)`}
            data-label="تأكيد"
            onClick={submit}
          >
            <Check size={24} />
          </Button>
      </div>
      </Dialog>
    </div>
  );
}
