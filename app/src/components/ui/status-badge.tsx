import * as React from 'react';

export function StatusBadge({ status }: { status: 'NEW'|'IN_PROGRESS'|'WAITING_PARTS'|'READY'|'DELIVERED'|'CANCELED' }) {
  const bg = `var(--status-${status}-bg)`;
  const fg = `var(--status-${status}-fg)`;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: bg as any, color: fg as any }}>
      {status}
    </span>
  );
}
