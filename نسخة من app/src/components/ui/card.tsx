import * as React from "react";
import { cn } from "@/lib/utils";

type Padding = "sm" | "md" | "lg";

export function Card({ className, children, interactive = false, padding = "md" }: { className?: string; children: React.ReactNode; interactive?: boolean; padding?: Padding }) {
  const pad = padding === "sm" ? "p-4" : padding === "lg" ? "p-8" : "p-6";
  return <div className={cn("card", pad, interactive && "interactive", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="card-header">
      <div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
        <h3 className="card-title">{title}</h3>
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card interactive padding="md">
      <div className="text-[var(--muted)] text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
