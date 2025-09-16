"use client";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (sp.get("error") === "CredentialsSignin") {
      setError("بيانات الدخول غير صحيحة");
    }
  }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      setError("بيانات الدخول غير صحيحة");
      showToast("بيانات الدخول غير صحيحة", "error");
      setLoading(false);
      return;
    }
    if (res?.url) {
      router.push(res.url);
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
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
            <Input
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
            <PasswordInput
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "جارٍ..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
