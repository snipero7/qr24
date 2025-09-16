import * as React from 'react';
import { cn } from '@/lib/utils';

export function KpiCard({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className={cn('card interactive flex items-start gap-3')} data-testid="kpi-card">
      {icon && (
        <div className="mt-0.5 text-[var(--color-primary)] bg-[color:rgb(29_78_216_/_0.08)] dark:bg-[color:rgb(59_130_246_/_0.15)] rounded-md p-2 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <div className="text-sm text-[var(--muted)]">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
