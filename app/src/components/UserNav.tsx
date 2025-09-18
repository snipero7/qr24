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
            className="icon-ghost no-label h-10 w-10 text-[var(--color-primary)] dark:text-[var(--color-primary)]"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <a href="/signin" className="btn-outline h-9">دخول</a>
      )}
    </div>
  );
}
