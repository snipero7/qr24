"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: sp.get("callbackUrl") ?? "/dashboard" });
    if (res?.error) setError("بيانات الدخول غير صحيحة");
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 card tonal p-0">
      <div className="card-header">
        <h1 className="card-title">تسجيل الدخول</h1>
      </div>
      <div className="card-section">
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">البريد</label>
            <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
            <input type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="btn-primary w-full">{loading?"جارٍ...":"دخول"}</button>
        </form>
      </div>
    </div>
  );
}
