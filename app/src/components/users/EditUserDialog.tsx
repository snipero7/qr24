"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/roleLabels";

const ROLES = ["ADMIN", "TECH", "CLERK"] as const;

type Role = (typeof ROLES)[number];

type EditUserDialogProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role | string;
  };
};

export default function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(isRole(user.role) ? user.role : "CLERK");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function resetForm() {
    setName(user.name);
    setEmail(user.email);
    setRole(isRole(user.role) ? user.role : "CLERK");
    setPassword("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        className="icon-ghost h-8 w-8"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        title="تعديل"
        aria-label="تعديل المستخدم"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="تعديل المستخدم" />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const payload = {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              role,
              password: password.trim() || undefined,
            };
            if (!payload.name || !payload.email) {
              setError("يرجى إدخال الاسم والبريد");
              return;
            }
            startTransition(async () => {
              try {
                const res = await fetch(`/api/users/${user.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError(data?.message || "فشل التحديث");
                  return;
                }
                showToast("تم تحديث المستخدم", "success");
                setOpen(false);
                setPassword("");
                router.refresh();
              } catch (err: any) {
                setError(err?.message || "فشل التحديث");
              }
            });
          }}
        >
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">الاسم</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">البريد</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الدور</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">كلمة المرور الجديدة (اختياري)</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="اتركه فارغًا للإبقاء على كلمة المرور الحالية"
              />
            </div>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
              }}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "جارٍ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function isRole(value: string | Role): value is Role {
  return ROLES.includes(value as Role);
}
