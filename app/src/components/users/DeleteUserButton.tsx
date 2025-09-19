"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";
import { showToast } from "@/components/ui/toast";

type TriggerVariant = "icon" | "pill";

type DeleteUserButtonProps = {
  user: {
    id: string;
    name: string;
    role: string;
  };
  variant?: TriggerVariant;
};

export default function DeleteUserButton({ user, variant = "icon" }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isPill = variant === "pill";
  const iconClass = isPill ? "w-4 h-4" : "w-5 h-5";

  return (
    <>
      <button
        type="button"
        className={isPill ? "action-pill action-pill--danger" : "icon-ghost text-red-600 hover:text-red-700"}
        onClick={() => setOpen(true)}
        title="حذف"
        aria-label="حذف المستخدم"
        data-label={isPill ? undefined : "حذف"}
      >
        <Trash2 className={iconClass} />
        {isPill ? <span>حذف</span> : null}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="حذف المستخدم"
        message={
          <span>
            سيتم حذف المستخدم <strong>{user.name}</strong>. لا يمكن التراجع عن هذه العملية.
          </span>
        }
        confirmText="حذف"
        cancelText="إلغاء"
        loading={isPending}
        onConfirm={() => {
          startTransition(async () => {
            try {
              const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                showToast(data?.message || "فشل الحذف", "error");
                return;
              }
              showToast("تم حذف المستخدم", "success");
              setOpen(false);
              router.refresh();
            } catch (err: any) {
              showToast(err?.message || "فشل الحذف", "error");
            }
          });
        }}
      />
    </>
  );
}
