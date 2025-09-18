"use client";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { showToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

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
const REMEMBER_KEY = "qr24:remember";
const REMEMBER_EMAIL_KEY = "qr24:remember-email";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
  const captchaDivRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const friendlyStoreName = useMemo(() => process.env.NEXT_PUBLIC_STORE_NAME || "منصة الصيانة", []);

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
    const reason = sp.get("reason");
    const mapped = mapError(err);
    if (mapped) setError(mapped);
    else if (reason === "timeout") {
      setError("تم إنهاء الجلسة بعد فترة من عدم النشاط. يرجى تسجيل الدخول مرة أخرى.");
    }
  }, [sp]);

  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(REMEMBER_KEY);
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedRemember === "true") {
        setRemember(true);
        if (savedEmail) setEmail(savedEmail);
      }
    } catch {}
  }, []);

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
      remember: remember ? "true" : "false",
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
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "true");
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {}
    if (res?.url) {
      router.push(res.url);
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe,#f8fafc_60%)] dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="max-w-md w-full space-y-6 text-right">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/70 dark:bg-white/5 shadow-lg">
            <span className="text-3xl">🔧</span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">منصة إدارة خدمات الصيانة</p>
              <p className="font-semibold text-lg text-slate-800 dark:text-white">{friendlyStoreName}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">مرحبًا بعودتك</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              سجّل دخولك لمتابعة الطلبات، تحديث الحالات، وإرسال الإشعارات للعملاء بسهولة. بيانات الدخول متاحة للمسؤولين والفنيين المخوّلين فقط.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-xl bg-white/60 dark:bg-white/10 p-3 shadow-sm">
                <p className="font-semibold">لوحة تحكم فورية</p>
                <p>اطلع على الطلبات والديون والتسليمات لحظة بلحظة.</p>
              </div>
              <div className="rounded-xl bg-white/60 dark:bg-white/10 p-3 shadow-sm">
                <p className="font-semibold">سجل آمن</p>
                <p>يتم حفظ كل حركة وتوثيقها لحماية عملك وبيانات عملائك.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md card tonal p-0 shadow-xl">
          <div className="card-header text-center lg:text-right">
            <h1 className="card-title text-2xl">تسجيل الدخول</h1>
          </div>
          <div className="card-section space-y-4">
            {error && <div className="text-red-600 dark:text-red-400 text-sm mb-1 bg-red-50/70 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/40 rounded-xl p-3">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">البريد</label>
                <Input
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600 dark:text-gray-300">كلمة المرور</label>
                  <a className="text-xs text-blue-600 hover:underline" href="mailto:support@example.com?subject=إعادة%20تعيين%20كلمة%20المرور">نسيت كلمة المرور؟</a>
                </div>
                <PasswordInput
                  className="input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-blue-500 h-4 w-4" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>تذكرني في هذا الجهاز</span>
                </label>
              </div>
              {RECAPTCHA_SITE_KEY ? (
                <div className="flex justify-center">
                  <div ref={captchaDivRef} />
                </div>
              ) : null}
              <button disabled={loading} className="btn-primary w-full h-11 text-base font-semibold">
                {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
              </button>
            </form>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              بالدخول إلى النظام فإنك توافق على السياسات الداخلية وحماية بيانات العملاء.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
