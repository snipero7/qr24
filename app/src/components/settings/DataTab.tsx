"use client";
import { useEffect, useState } from "react";
import { Database, CloudUpload } from "lucide-react";

export function DataTab() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/backup/logs");
      if (!res.ok) throw new Error("فشل تحميل السجلات");
      setRows(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function backupNow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/backup/now", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل النسخ");
      try {
        // dynamic import to avoid SSR edges when running tests
        const mod = await import("@/components/ui/toast");
        mod.showToast("تم إنشاء نسخة احتياطية", "success");
      } catch {}
      load();
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex items-center gap-2">
        <a className="icon-ghost" title="تصدير الطلبات" href="/api/orders/export">
          <Database size={24} />
        </a>
        <a className="icon-ghost" title="تصدير الديون" href="/api/debts/export">
          <Database size={24} />
        </a>
        <button className="icon-ghost" onClick={backupNow} disabled={busy} title="إنشاء نسخة احتياطية الآن">
          <CloudUpload size={24} />
        </button>
      </div>
      <div className="card-section p-0 overflow-x-auto">
        <table className="glass-table w-full">
          <thead>
            <tr className="text-right">
              <th className="p-2">التاريخ</th>
              <th className="p-2">الملف</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">رابط</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="glass-row rounded-xl">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">{r.fileName}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.fileUrl ? (
                  <a className="text-blue-600" href={r.fileUrl} target="_blank" rel="noreferrer">
                    تنزيل
                  </a>
                ) : (
                  "-"
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
