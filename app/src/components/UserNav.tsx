"use client";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, UserCircle2 } from "lucide-react";
import { roleToArabic } from "@/lib/roleLabels";

export function UserNav() {
  const { data } = useSession();
  const user = data?.user as any;
  const displayName = user?.name || (user?.email ? String(user.email).split("@")[0] : "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="ms-auto flex items-center gap-3 text-sm">
      {user ? (
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-[color:rgb(100_116_139)] transition-colors hover:text-[var(--foreground)] dark:text-[color:rgb(148_163_184)] dark:hover:text-white"
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="معلومات الحساب"
            title="معلومات الحساب"
          >
            <UserCircle2 className="w-6 h-6" />
          </button>
          {open ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-60 translate-y-1 origin-top-left rounded-xl border border-[color:rgb(59_130_246_/_0.25)] bg-white p-4 text-sm shadow-lg backdrop-blur text-left [direction:ltr] [&_*]:text-[color:rgb(51_65_85)] dark:[&_*]:text-[color:rgb(203_213_225)] dark:border-[color:rgb(96_165_250_/_0.35)] dark:bg-[color:rgb(30_41_59_/_0.92)]">
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-[var(--foreground)] leading-tight">
                    {displayName || "مستخدم النظام"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {roleToArabic(user?.role)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/signin" });
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <a href="/signin" className="btn-outline h-9">دخول</a>
      )}
    </div>
  );
}
