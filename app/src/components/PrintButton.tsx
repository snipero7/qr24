"use client";
export function PrintButton({ className }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className || "border rounded px-3 py-2"}>
      طباعة
    </button>
  );
}

