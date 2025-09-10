"use client";
import { signOut, useSession } from "next-auth/react";

export function UserNav() {
  const { data } = useSession();
  const user = data?.user as any;
  return (
    <div className="ms-auto flex items-center gap-3 text-sm">
      {user ? (
        <>
          <span className="text-gray-600">{user?.email} ({user?.role})</span>
          <button onClick={()=>signOut({ callbackUrl: "/signin" })} className="px-3 py-1 rounded border">خروج</button>
        </>
      ) : (
        <a href="/signin" className="px-3 py-1 rounded border">دخول</a>
      )}
    </div>
  );
}

