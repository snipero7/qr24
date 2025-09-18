"use client";

import { type DebtRow } from "@/components/debts/DebtsTree";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { debtTemplateForStatus } from "@/config/notifications";
import { toLatinDigits } from "@/lib/utils";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";

export function DebtActions({
  debt,
  phone,
  shopName,
  editingId,
  setEditingId,
  setAllowCollapse,
  onSave,
  onDelete,
}: {
  debt: DebtRow;
  phone?: string | null;
  shopName: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setAllowCollapse: (v: boolean) => void;
  onSave: (service: string | undefined, amount: number | undefined) => Promise<void>;
  onDelete: () => void;
}) {
  const isPaid = debt.status === "PAID";
  const isEditing = editingId === debt.id;

  useEffect(() => {
    if (isPaid && isEditing) {
      setEditingId(null);
    }
  }, [isPaid, isEditing, setEditingId, debt.id]);

  return (
    <div className="flex items-center gap-2">
      <WhatsAppButton
        phone={phone ? toLatinDigits(phone) : phone}
        templateKey={debtTemplateForStatus(debt.status) as any}
        params={{ shopName, remaining: debt.remaining, paid: debt.paid, amount: debt.amount, service: debt.service }}
        variant="icon"
      />
      {!isPaid && (
        <AddPaymentDialog
          debtId={debt.id}
          variant="icon"
          onOpenChange={(open) => setAllowCollapse(!open)}
        />
      )}
      {!isPaid && isEditing ? (
        <>
          <button
            className="btn-primary h-8 px-3"
            onClick={async (e) => {
              e.stopPropagation();
              const svc = (document.getElementById(`svc-${debt.id}`) as HTMLInputElement)?.value;
              const amt = (window as any)[`amountVal_${debt.id}`];
              await onSave(svc, amt);
              setEditingId(null);
            }}
          >
            حفظ
          </button>
          <button
            className="btn-outline h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(null);
            }}
          >
            إلغاء
          </button>
        </>
      ) : (
        <>
          {!isPaid && (
            <button
              title="تعديل"
              aria-label="تعديل"
              data-label="تعديل"
              className="icon-ghost"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(debt.id);
              }}
            >
              <Pencil className="w-5 h-5 text-[var(--color-primary)]" />
            </button>
          )}
          <button
            title="حذف"
            aria-label="حذف"
            data-label="حذف"
            className="icon-ghost text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
