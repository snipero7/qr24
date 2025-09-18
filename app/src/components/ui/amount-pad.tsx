"use client";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  name: string;
  defaultValue?: number | string;
  label?: string;
  className?: string;
  onChangeValue?: (n: number) => void;
  closeOnOutsideClick?: boolean;
};

export function AmountPad({ name, defaultValue, label = "المبلغ", className, onChangeValue, closeOnOutsideClick = true }: Props) {
  const [val, setVal] = useState<string>("");
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null && val === "") {
      const n = Number(defaultValue);
      if (!isNaN(n) && n > 0) setVal(String(Number(n.toFixed(2))));
    }
  }, [defaultValue]);

  // Close on outside click and coordinate single-open pad between instances
  useEffect(() => {
    function onActivate(ev: Event) {
      const padId = (ev as CustomEvent<string>).detail;
      if (padId !== id) setOpen(false);
    }
    window.addEventListener('amount-pad-activated', onActivate as EventListener);
    if (closeOnOutsideClick) {
      const onDoc = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', onDoc);
      return () => {
        document.removeEventListener('mousedown', onDoc);
        window.removeEventListener('amount-pad-activated', onActivate as EventListener);
      };
    }
    return () => {
      window.removeEventListener('amount-pad-activated', onActivate as EventListener);
    };
  }, [id, closeOnOutsideClick]);

  function update(next: string) { setVal(next); }

  function append(d: string) {
    setVal((prev) => {
      if (d === ".") {
        if (!prev) return "0.";
        if (prev.includes(".")) return prev;
        return prev + ".";
      }
      if (prev === "0") return d;
      if (prev.includes(".")) {
        const [, dec] = prev.split(".");
        if (dec.length >= 2) return prev;
      }
      return prev + d;
    });
  }
  function backspace() { setVal((p) => p.slice(0, -1)); }
  function clearAll() { update(""); }

  const display = val || "0";

  useEffect(() => {
    if (onChangeValue) {
      const n = Number(val);
      onChangeValue(!isNaN(n) ? n : 0);
    }
  }, [val, onChangeValue]);

  return (
    <div className={className} ref={ref}>
      <input type="hidden" name={name} value={val} />
      <button type="button" className="card mb-2 w-full text-left" onClick={() => { setOpen(true); try { window.dispatchEvent(new CustomEvent('amount-pad-activated', { detail: id })); } catch {} }}>
        <div className="flex items-center justify-between">
          <div className="font-semibold tabular-nums order-1">{display} ر.س</div>
          <div className="text-sm text-gray-500 order-2">{label}</div>
        </div>
      </button>
      {open && (
      <div dir="ltr" className="grid grid-cols-3 gap-2">
        {["7","8","9","4","5","6","1","2","3"].map((k)=> (
          <button type="button" key={k} className="btn-outline h-10" onClick={()=>append(k)}>{k}</button>
        ))}
        <button type="button" className="btn-outline h-10" onClick={()=>append("0")}>0</button>
        <button type="button" className="btn-outline h-10" onClick={()=>append(".")}>.</button>
        <button type="button" className="btn-outline h-10" onClick={backspace}>⌫</button>
      </div>
      )}
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className="btn-outline h-9" onClick={clearAll}>مسح</button>
          <button type="button" className="btn-outline h-9" onClick={()=>setOpen(false)}>إخفاء</button>
        </div>
      )}
    </div>
  );
}
