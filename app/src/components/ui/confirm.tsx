"use client";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "تأكيد",
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm(): Promise<void> | void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader title={title} />
      <div className="text-sm text-gray-700 mb-3">{message}</div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          {cancelText}
        </Button>
        <Button size="sm" disabled={loading} onClick={onConfirm}>
          {loading ? "جارٍ..." : confirmText}
        </Button>
      </div>
    </Dialog>
  );
}

