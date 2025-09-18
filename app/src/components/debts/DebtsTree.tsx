"use client";
import React, { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { AmountPad } from "@/components/ui/amount-pad";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { debtTemplateForStatus } from "@/config/notifications";
import { formatYMD } from "@/lib/date";
import { toLatinDigits } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";

export type DebtRow = { id: string; service: string; amount: number; paid: number; remaining: number; status: string; createdAt: string };
export type DebtGroup = { shopName: string; phone?: string | null; debts: DebtRow[] };

export default function DebtsTree({ groups }: { groups: DebtGroup[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      if (!wrapRef.current.contains(e.target as Node)) setExpandedIdx(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

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
                      <td className="p-2 flex items-center gap-2">
                        <WhatsAppButton
                          phone={g.phone ? toLatinDigits(g.phone) : g.phone}
                          templateKey={debtTemplateForStatus(d.status) as any}
                          params={{ shopName: g.shopName, remaining: d.remaining, paid: d.paid, amount: d.amount, service: d.service }}
                          variant="icon"
                        />
                        <AddPaymentDialog debtId={d.id} variant="icon" />
                        {editing === d.id ? (
                          <>
                            <button className="btn-primary h-8 px-3" onClick={async (e)=>{
                              e.stopPropagation();
                              const svc = (document.getElementById(`svc-${d.id}`) as HTMLInputElement)?.value;
                              const amt = (window as any)[`amountVal_${d.id}`];
                              await save(d.id, { service: svc, amount: amt });
                              setEditing(null);
                            }}>حفظ</button>
                            <button className="btn-outline h-8 px-3" onClick={(e)=>{ e.stopPropagation(); setEditing(null); }}>إلغاء</button>
                          </>
                        ) : (
                          <>
                            <button title="تعديل" className="icon-ghost" onClick={(e)=>{ e.stopPropagation(); setEditing(d.id); }}>
                              <Pencil className="w-5 h-5 text-[var(--color-primary)] dark:text-[var(--color-primary)]" />
                            </button>
                            <button title="حذف" className="icon-ghost text-red-600 dark:text-red-400" onClick={(e)=>{ e.stopPropagation(); setDeleteId(d.id); setConfirmOpen(true); }}>
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
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
