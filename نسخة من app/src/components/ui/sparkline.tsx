import * as React from 'react';

export function Sparkline({ values, width = 600, height = 80, color = '#1D4ED8' }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (!values.length) return <div className="text-sm text-gray-500">لا توجد بيانات</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const W = width, H = height;
  const step = (W - pad * 2) / Math.max(1, values.length - 1);
  const norm = (v: number) => max === min ? H/2 : pad + (H - pad*2) * (1 - (v - min) / (max - min));
  const points = values.map((v, i) => `${pad + i * step},${norm(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <line x1={0} y1={H-1} x2={W} y2={H-1} stroke="#e5e7eb" />
    </svg>
  );
}

