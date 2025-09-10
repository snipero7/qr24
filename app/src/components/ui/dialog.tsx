"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange(open: boolean): void; children: React.ReactNode }) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onOpenChange(false); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn("bg-white w-full max-w-md rounded-md shadow p-4")}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold mb-3">{title}</h3>;
}

