"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { roleToArabic } from "@/lib/roleLabels";

export function UserNav() {
  const { data } = useSession();
  const user = data?.user as any;
  const displayName = user?.name || (user?.email ? String(user.email).split("@")[0] : "");
  return (
    <div className="ms-auto flex items-center gap-3 text-sm">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-gray-600 flex items-center gap-1">
            <span className="font-medium text-[var(--foreground)]">{displayName}</span>
            <span className="text-gray-500">({roleToArabic(user?.role)})</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)] dark:text-[color:rgb(148_163_184)] dark:hover:text-white"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <a href="/signin" className="btn-outline h-9">دخول</a>
      )}
    </div>
  );
}
