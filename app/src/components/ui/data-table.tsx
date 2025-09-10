import * as React from 'react';

export function DataTable({ headers, rows, emptyText = 'لا توجد بيانات', renderRow }: {
  headers: React.ReactNode[];
  rows: any[];
  emptyText?: string;
  renderRow: (row: any) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-2 text-right">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="p-4 text-center text-gray-500" colSpan={headers.length}>{emptyText}</td></tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className="border-b hover:bg-black/5 dark:hover:bg-white/5">{renderRow(r)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

