"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "تعذر تنفيذ الطلب");
      }
      setMessage("إذا كان البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة التعيين.");
      showToast("تم إرسال الرابط إذا كان البريد موجودًا", "success");
    } catch (err: any) {
      const msg = err?.message || "تعذر تنفيذ الطلب";
      setMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 card tonal">
      <div className="card-header">
        <h1 className="card-title text-xl">إعادة تعيين كلمة المرور</h1>
      </div>
      <div className="card-section space-y-4">
        <p className="text-sm text-gray-600">
          أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
            <Input
              type="email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <Button disabled={loading} className="w-full" type="submit">
            {loading ? "جارٍ إعادة التعيين..." : "إعادة التعيين"}
          </Button>
        </form>
        {message && <div className="text-sm text-blue-600">{message}</div>}
        <div className="text-sm text-gray-500 text-center">
          <button type="button" className="text-blue-600 hover:underline" onClick={() => router.push("/signin")}>عودة لتسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
}
