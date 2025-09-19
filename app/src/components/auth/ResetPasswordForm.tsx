"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      const msg = "كلمتا المرور غير متطابقتين";
      setMessage(msg);
      showToast(msg, "error");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "تعذر إعادة التعيين");
      showToast("تم تعديل كلمة المرور", "success");
      router.push("/signin?reset=success");
    } catch (err: any) {
      const msg = err?.message || "تعذر إعادة التعيين";
      setMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 card tonal">
      <div className="card-header">
        <h1 className="card-title text-xl">تعيين كلمة مرور جديدة</h1>
      </div>
      <div className="card-section space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">كلمة المرور الجديدة</label>
            <Input
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">تأكيد كلمة المرور</label>
            <Input
              type="password"
              className="input w-full"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button disabled={loading} className="w-full" type="submit">
            {loading ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
          </Button>
        </form>
        {message && <div className="text-sm text-red-600">{message}</div>}
        <div className="text-sm text-gray-500 text-center">
          <button type="button" className="text-blue-600 hover:underline" onClick={() => router.push("/signin")}>عودة لتسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
}
