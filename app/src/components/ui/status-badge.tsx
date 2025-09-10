import * as React from 'react';

const styles: Record<string, string> = {
  NEW: 'bg-[#DBEAFE] text-[#1E3A8A]',
  IN_PROGRESS: 'bg-[#FEF3C7] text-[#B45309]',
  WAITING_PARTS: 'bg-[#EDE9FE] text-[#6D28D9]',
  READY: 'bg-[#D1FAE5] text-[#065F46]',
  DELIVERED: 'bg-[#E5E7EB] text-[#374151]',
  CANCELED: 'bg-[#FEE2E2] text-[#991B1B]',
};

export function StatusBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? ''}`}>{status}</span>
  );
}

