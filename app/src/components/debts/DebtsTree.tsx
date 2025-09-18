"use client";
import React, { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AmountPad } from "@/components/ui/amount-pad";
import { DebtActions } from "@/components/debts/DebtActions";
import { formatYMD } from "@/lib/date";
import { toLatinDigits } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm";

export type DebtRow = { id: string; service: string; amount: number; paid: number; remaining: number; status: string; createdAt: string };
export type DebtGroup = { shopName: string; phone?: string | null; debts: DebtRow[] };

export default function DebtsTree({ groups }: { groups: DebtGroup[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [allowCollapse, setAllowCollapse] = useState(true);

  async function save(id: string, data: { service?: string; amount?: number; notes?: string }) {
    const res = await fetch(`/api/debts/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) alert('فشل التعديل');
    // Let AutoRefresh hook update the page
    try { window.dispatchEvent(new CustomEvent('order-status-updated')); } catch {}
  }
  async function remove(id: string) {
    const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    if (!res.ok) alert('فشل الحذف');
    try { window.dispatchEvent(new CustomEvent('order-status-updated')); } catch {}
  }

  // Close all when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!allowCollapse) return;
      if (!wrapRef.current.contains(e.target as Node)) setExpandedIdx(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [allowCollapse]);

  return (
    <div className="space-y-3" ref={wrapRef}>
      {groups.map((g, idx) => (
        <div key={`grp-${g.shopName}-${g.phone ?? ''}-${idx}`} className="card interactive p-0">
          <div
            role="button"
            className="card-header px-4 py-3 cursor-pointer"
            onClick={() => setExpandedIdx(expandedIdx === String(idx) ? null : String(idx))}
          >
            <div>
              <div className="card-subtitle">{g.phone ? toLatinDigits(g.phone) : '-'}</div>
              <h3 className="card-title">{g.shopName}</h3>
            </div>
          </div>
          {expandedIdx === String(idx) && (
            <div className="card-section overflow-x-auto p-0">
              <table className="min-w-full text-sm">
                <thead className="bg-white dark:bg-white/5">
                  <tr className="text-right">
                    <th className="p-2 font-semibold">الخدمة</th>
                    <th className="p-2 font-semibold">المبلغ</th>
                    <th className="p-2 font-semibold">المدفوع</th>
                    <th className="p-2 font-semibold">المتبقي</th>
                    <th className="p-2 font-semibold">الحالة</th>
                    <th className="p-2 font-semibold">تاريخ</th>
                    <th className="p-2 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {g.debts.map((d) => (
                    <tr key={d.id} className="bg-white dark:bg-transparent hover:bg-black/5 dark:hover:bg-white/10">
                      <td className="p-2">{editing === d.id ? (
                        <Input defaultValue={d.service} className="input h-8" id={`svc-${d.id}`} />
                      ) : d.service}</td>
                      <td className="p-2 tabular-nums">{editing === d.id ? (
                        <AmountPad name={`amount-${d.id}`} defaultValue={d.amount} onChangeValue={(n)=>{ (window as any)[`amountVal_${d.id}`]=n; }} />
                      ) : d.amount}</td>
                      <td className="p-2 tabular-nums">{d.paid}</td>
                      <td className="p-2 tabular-nums">{d.remaining}</td>
                      <td className="p-2"><StatusBadge status={d.status as any} /></td>
                      <td className="p-2">{formatYMD(d.createdAt)}</td>
                      <td className="p-2">
                        <DebtActions
                          debt={d}
                          phone={g.phone}
                          shopName={g.shopName}
                          editingId={editing}
                          setEditingId={setEditing}
                          setAllowCollapse={setAllowCollapse}
                          onSave={async (svc, amount) => {
                            await save(d.id, { service: svc, amount });
                          }}
                          onDelete={() => {
                            setDeleteId(d.id);
                            setConfirmOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o)=>{ setConfirmOpen(o); if (!o) setDeleteId(null); }}
        title="حذف الدين"
        message="سيتم حذف الدين وجميع الدفعات المرتبطة به. لا يمكن التراجع."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={async ()=>{ if(deleteId){ await remove(deleteId); setConfirmOpen(false); setDeleteId(null);} }}
      />
    </div>
  );
}
