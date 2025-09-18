"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";
import { showToast } from "@/components/ui/toast";

type DeleteUserButtonProps = {
  user: {
    id: string;
    name: string;
    role: string;
  };
};

export default function DeleteUserButton({ user }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className="icon-ghost h-8 w-8 text-red-600 hover:text-red-700"
        data-label="حذف"
        onClick={() => setOpen(true)}
        title="حذف"
        aria-label="حذف المستخدم"
      >
        <Trash2 className="w-4 h-4" />
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
