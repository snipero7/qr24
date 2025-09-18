"use client";
import { useEffect, useState } from "react";
import { Database, CloudUpload, Link as LinkIcon, Unlink, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";

export function DataTab() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [weekday, setWeekday] = useState(6);
  const [hour, setHour] = useState(3);
  const [gConnected, setGConnected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const [logsRes, setRes] = await Promise.all([
        fetch("/api/backup/logs"),
        fetch("/api/settings"),
      ]);
      if (!logsRes.ok) throw new Error("فشل تحميل السجلات");
      setRows(await logsRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        setAutoEnabled(!!s.backupAutoEnabled);
        setWeekday(Number(s.backupWeekday ?? 6));
        setHour(Number(s.backupHour ?? 3));
        setGConnected(!!s.gdriveAccessToken);
      }
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

  async function saveSchedule() {
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ backupAutoEnabled: autoEnabled, backupWeekday: weekday, backupHour: hour }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل الحفظ');
      try { const mod = await import('@/components/ui/toast'); mod.showToast('تم حفظ إعدادات النسخ التلقائي', 'success'); } catch {}
    } catch (e:any) {
      try { const mod = await import('@/components/ui/toast'); mod.showToast(e.message || 'فشل الحفظ', 'error'); } catch {}
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex items-center gap-2">
        <a className="icon-ghost" title="تصدير الطلبات" aria-label="تصدير الطلبات" href="/api/orders/export">
          <Database size={24} />
        </a>
        <a className="icon-ghost" title="تصدير الديون" aria-label="تصدير الديون" href="/api/debts/export">
          <Database size={24} />
        </a>
        <button className="icon-ghost" onClick={backupNow} disabled={busy} title="إنشاء نسخة احتياطية الآن" aria-label="إنشاء نسخة احتياطية الآن">
          <CloudUpload size={24} />
        </button>
        {(() => {
          if (typeof window === 'undefined') return null;
          return (
            <>
              <span></span>
              {/* Connect / Disconnect Google Drive */}
              {!gConnected ? (
                <a className="icon-ghost" href="/api/gdrive/oauth/start" title="ربط Google Drive" aria-label="ربط Google Drive"><LinkIcon size={24} /></a>
              ) : (
                <button className="icon-ghost" onClick={async ()=>{ try { const r=await fetch('/api/gdrive/oauth/disconnect',{method:'POST'}); const d=await r.json(); if(!r.ok) throw new Error(d?.message||'فشل'); setGConnected(false);} catch{} }} title="فصل Google Drive" aria-label="فصل Google Drive"><Unlink size={24}/></button>
              )}
            </>
          );
        })()}
      </div>
      <div className="card-section">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">النسخ الأسبوعي</label>
            <select className="input h-9" value={autoEnabled ? '1' : '0'} onChange={e=>setAutoEnabled(e.target.value==='1')}>
              <option value="1">مفعّل</option>
              <option value="0">معطّل</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">اليوم</label>
            <select className="input h-9" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>
              <option value={0}>الأحد</option>
              <option value={1}>الإثنين</option>
              <option value={2}>الثلاثاء</option>
              <option value={3}>الأربعاء</option>
              <option value={4}>الخميس</option>
              <option value={5}>الجمعة</option>
              <option value={6}>السبت</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">الساعة (بتوقيت الرياض)</label>
            <select className="input h-9" value={hour} onChange={e=>setHour(Number(e.target.value))}>
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>{i}:00</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button className="icon-ghost" onClick={saveSchedule} title="حفظ الإعدادات" aria-label="حفظ الإعدادات">حفظ</button>
          </div>
        </div>
      </div>
      <div className="card-section p-0 overflow-x-auto">
        <table className="glass-table w-full">
          <thead>
            <tr className="text-right">
              <th className="p-2">التاريخ</th>
              <th className="p-2">الملف</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">رابط</th>
              <th className="p-2">إجراء</th>
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
                <td className="p-2 flex items-center gap-2">
                  <button className="btn-outline h-7 px-2 text-xs" title="استعادة" onClick={async ()=>{ try { const res = await fetch(`/api/backup/restore?id=${r.id}`, { method: 'POST' }); const data = await res.json().catch(()=>({})); if (!res.ok) throw new Error(data?.message || 'فشل الاستعادة'); } catch (e:any) { setError(e.message||'فشل الاستعادة'); } }}>
                    استعادة
                  </button>
                  <button className="icon-ghost text-red-600" title="حذف" onClick={() => setConfirmOpen(r.id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!confirmOpen}
        onOpenChange={(o)=>{ if(!o) setConfirmOpen(null); }}
        title="حذف النسخة الاحتياطية"
        message="سيتم حذف السجل وربما الملف المحلي إن وجد. لا يمكن التراجع."
        confirmText={deleting ? 'جارٍ...' : 'حذف'}
        cancelText="إلغاء"
        loading={deleting}
        onConfirm={async ()=>{
          if (!confirmOpen) return;
          try {
            setDeleting(true);
            const res = await fetch(`/api/backup/logs?id=${confirmOpen}`, { method: 'DELETE' });
            const data = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(data?.message || 'فشل الحذف');
            setConfirmOpen(null);
            load();
          } catch (e:any) { setError(e.message || 'فشل الحذف'); }
          setDeleting(false);
        }}
      />
    </div>
  );
}
