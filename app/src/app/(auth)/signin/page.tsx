"use client";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: any) => number;
      reset: (widgetId?: number) => void;
      ready: (cb: () => void) => void;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();
  const captchaDivRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  function mapError(code: string | null) {
    switch (code) {
      case "LOCKED":
        return "تم إيقاف تسجيل الدخول مؤقتًا بسبب المحاولات المتكررة. يرجى المحاولة لاحقًا أو التواصل مع المسؤول.";
      case "CAPTCHA_FAILED":
        return "تعذّر التحقق من أنك لست روبوتًا. يرجى المحاولة مرة أخرى.";
      case "INVALID":
      case "CredentialsSignin":
        return "بيانات الدخول غير صحيحة";
      default:
        return null;
    }
  }

  function resetCaptcha() {
    if (widgetIdRef.current !== null) {
      try { window.grecaptcha?.reset(widgetIdRef.current); } catch {}
    }
    setCaptchaToken(null);
  }

  useEffect(() => {
    const err = sp.get("error");
    const mapped = mapError(err);
    if (mapped) setError(mapped);
  }, [sp]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !captchaDivRef.current) return;
    let cancelled = false;

    function ensureScript() {
      return new Promise<typeof window.grecaptcha | null>((resolve, reject) => {
        if (window.grecaptcha) return resolve(window.grecaptcha);
        const existing = document.getElementById("recaptcha-script");
        if (existing) {
          existing.addEventListener("load", () => resolve(window.grecaptcha ?? null), { once: true });
          existing.addEventListener("error", () => reject(new Error("failed")), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.id = "recaptcha-script";
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit&hl=ar";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.grecaptcha ?? null);
        script.onerror = () => reject(new Error("failed"));
        document.body.appendChild(script);
      });
    }

    ensureScript()
      .then((grecaptcha) => {
        if (cancelled || !grecaptcha || !captchaDivRef.current) return;
        grecaptcha.ready(() => {
          if (cancelled || !captchaDivRef.current) return;
          widgetIdRef.current = grecaptcha.render(captchaDivRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (token: string) => {
              setCaptchaToken(token);
              setError(null);
            },
            "expired-callback": () => {
              setCaptchaToken(null);
            },
            "error-callback": () => {
              setCaptchaToken(null);
              setError("تعذّر تحميل reCAPTCHA. حاول مرة أخرى.");
            },
          });
        });
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل أداة التحقق الأمني. حدّث الصفحة وحاول مجددًا.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      const message = "يرجى إتمام التحقق الأمني قبل المتابعة";
      setError(message);
      showToast(message, "error");
      setLoading(false);
      return;
    }
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      captchaToken: captchaToken ?? undefined,
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      const message = mapError(res.error) ?? "بيانات الدخول غير صحيحة";
      setError(message);
      showToast(message, "error");
      if (RECAPTCHA_SITE_KEY) resetCaptcha();
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
          {RECAPTCHA_SITE_KEY ? (
            <div className="flex justify-center">
              <div ref={captchaDivRef} />
            </div>
          ) : null}
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "جارٍ..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
