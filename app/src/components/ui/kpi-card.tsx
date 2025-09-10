import * as React from 'react';
import { cn } from '@/lib/utils';

export function KpiCard({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className={cn('card flex items-start gap-3')} data-testid="kpi-card">
      {icon && <div className="mt-0.5 text-[var(--color-primary)]">{icon}</div>}
      <div>
        <div className="text-sm text-[var(--muted)]">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
