"use client";
import { Printer } from "lucide-react";

export function PrintButton({ className, label = "طباعة" }: { className?: string; label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      title={label}
      aria-label={label}
      className={className || "icon-ghost"}
    >
      <Printer size={24} />
    </button>
  );
}
