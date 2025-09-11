"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";
export type ToastItem = { id: number; message: string; type: ToastType };

let idSeq = 1;

export function showToast(message: string, type: ToastType = "info") {
  try {
    const ev = new CustomEvent<ToastItem>("app-toast", {
      detail: { id: idSeq++, message, type },
    } as any);
    window.dispatchEvent(ev);
  } catch {}
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastItem>).detail;
      if (!detail) return;
      setToasts((prev) => [...prev, detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 3000);
    }
    window.addEventListener("app-toast", onToast as EventListener);
    return () => window.removeEventListener("app-toast", onToast as EventListener);
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-20 right-4 z-[1000] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </div>
    </>
  );
}

function Toast({ item }: { item: ToastItem }) {
  const color = item.type === "success" ? "text-emerald-600" : item.type === "error" ? "text-red-600" : "text-blue-600";
  const Icon = item.type === "success" ? CheckCircle2 : item.type === "error" ? AlertTriangle : Info;
  return (
    <div className="pointer-events-auto rounded-xl bg-[var(--surface)]/80 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 shadow-md px-3 py-2 flex items-center gap-2 min-w-[220px]">
      <Icon size={18} className={color} />
      <div className="text-sm">{item.message}</div>
      <X size={16} className="ms-auto cursor-pointer opacity-60 hover:opacity-100" onClick={(e)=>{ e.stopPropagation?.(); (e.currentTarget.parentElement as any)?.remove(); }} />
    </div>
  );
}

