import * as React from 'react';

export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="card tonal mb-4 action-bar">
      <div className="rounded-xl bg-[color:rgb(236_239_244)] dark:bg-white/10 p-4 ring-1 ring-black/10 dark:ring-white/10 grid grid-cols-1 md:grid-cols-6 gap-3">
        {children}
      </div>
    </div>
  );
}
