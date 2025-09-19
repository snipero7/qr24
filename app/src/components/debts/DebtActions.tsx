"use client";

import { type DebtRow } from "@/components/debts/DebtsTree";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { debtTemplateForStatus } from "@/config/notifications";
import { toLatinDigits } from "@/lib/utils";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { Pencil, Trash2, Check, X } from "lucide-react";
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
    <div className="flex flex-wrap items-center justify-center gap-2">
      <WhatsAppButton
        phone={phone ? toLatinDigits(phone) : phone}
        templateKey={debtTemplateForStatus(debt.status) as any}
        params={{ shopName, remaining: debt.remaining, paid: debt.paid, amount: debt.amount, service: debt.service }}
        variant="icon"
      />
      {!isPaid && (
        <AddPaymentDialog
          debtId={debt.id}
          variant="pill"
          onOpenChange={(open) => setAllowCollapse(!open)}
        />
      )}
      {!isPaid && isEditing ? (
        <>
          <button
            className="action-pill action-pill--success"
            onClick={async (e) => {
              e.stopPropagation();
              const svc = (document.getElementById(`svc-${debt.id}`) as HTMLInputElement)?.value;
              const amt = (window as any)[`amountVal_${debt.id}`];
              await onSave(svc, amt);
              setEditingId(null);
              setAllowCollapse(true);
            }}
          >
            <Check className="w-4 h-4" />
            <span>حفظ</span>
          </button>
          <button
            className="action-pill"
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(null);
              setAllowCollapse(true);
            }}
          >
            <X className="w-4 h-4" />
            <span>إلغاء</span>
          </button>
        </>
      ) : (
        <>
          {!isPaid && (
            <button
              title="تعديل"
              aria-label="تعديل"
              className="action-pill"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(debt.id);
                setAllowCollapse(false);
              }}
            >
              <Pencil className="w-4 h-4" />
              <span>تعديل</span>
            </button>
          )}
          <button
            title="حذف"
            aria-label="حذف"
            className="action-pill action-pill--danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف</span>
          </button>
        </>
      )}
    </div>
  );
}
