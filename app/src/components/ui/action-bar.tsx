import * as React from 'react';

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="card mb-4"><div className="grid grid-cols-1 md:grid-cols-6 gap-4">{children}</div></div>;
}

