"use client";

import { useTransition, useState, useRef } from "react";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/roleLabels";
import { showToast } from "@/components/ui/toast";

const ROLES = ["ADMIN", "TECH", "CLERK"] as const;

export default function NewUserForm({ action }: { action(formData: FormData): Promise<void> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        formRef.current?.reset();
        showToast("تم إنشاء المستخدم", "success");
      } catch (e: any) {
        setError(e?.message || "فشل الإنشاء");
        showToast(e?.message || "فشل الإنشاء", "error");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
      <Input name="name" required placeholder="الاسم" autoComplete="name" />
      <Input name="email" required type="email" placeholder="البريد" autoComplete="email" />
      <PasswordInput name="password" required placeholder="كلمة المرور" autoComplete="new-password" />
      <select name="role" defaultValue="CLERK" className="input">
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending} className="h-14 sm:h-12">
        {pending ? "جارٍ..." : "إنشاء"}
      </Button>
      {error ? <div className="sm:col-span-5 text-red-600 text-sm mt-1">{error}</div> : null}
    </form>
  );
}
