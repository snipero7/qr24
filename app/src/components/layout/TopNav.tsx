"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  Wallet,
  QrCode,
  Users,
  BarChart2,
  Wrench,
  Menu
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "منصة الصيانة";
  const envLogo = process.env.NEXT_PUBLIC_STORE_LOGO as string | undefined;
  const logoSrc = envLogo
    ? (envLogo.startsWith("http") || envLogo.startsWith("/") ? envLogo : `/${envLogo}`)
    : "/logo-placeholder.svg";

  const items: NavItem[] = useMemo(
    () => [
      {
        href: "/dashboard",
        label: "الرئيسية",
        icon: LayoutDashboard,
        isActive: (p) => p === "/" || p.startsWith("/dashboard"),
      },
      {
        href: "/orders/new",
        label: "طلب جديد",
        icon: FilePlus2,
        isActive: (p) => p === "/orders/new",
      },
      {
        href: "/orders",
        label: "الطلبات",
        icon: ClipboardList,
        isActive: (p) => p.startsWith("/orders") && p !== "/orders/new",
      },
      {
        href: "/debts",
        label: "الديون",
        icon: Wallet,
        isActive: (p) => p.startsWith("/debts"),
      },
      {
        href: "/track/demo12345",
        label: "تتبع",
        icon: QrCode,
        isActive: (p) => p.startsWith("/track"),
      },
      {
        href: "/users",
        label: "المستخدمون",
        icon: Users,
        isActive: (p) => p.startsWith("/users"),
      },
      {
        href: "/reports",
        label: "التقارير",
        icon: BarChart2,
        isActive: (p) => p.startsWith("/reports"),
      },
    ],
    []
  );

  const linkBase = [
    "px-5 py-2 rounded-xl text-sm font-medium transition-colors",
    "text-[color:rgb(100_116_139)] dark:text-[color:rgb(148_163_184)]",
    "hover:text-[var(--foreground)]",
  ].join(" ");
  const linkActive = [
    // Use surface variable so it adapts to both themes
    "bg-[var(--surface)] text-[var(--foreground)]",
    "shadow-[0_1px_0_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.06)]",
    "ring-1 ring-black/5 dark:ring-white/10",
    "font-semibold",
  ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-[var(--surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/70 shadow-sm">
      <div className="container h-14 flex items-center justify-between gap-4">
        {/* Right side (brand + toggler in RTL) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="القائمة"
            aria-expanded={open}
            aria-controls="topnav-menu"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="font-semibold text-sm sm:text-base inline-flex items-center gap-2">
            <img src={logoSrc} alt={storeName} className="w-7 h-7 rounded" />
            <span>{storeName}</span>
          </Link>
        </div>

        {/* Desktop nav + actions */}
        <div className="hidden md:flex items-center gap-2 w-full">
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center rounded-2xl p-1 bg-[color:rgb(239_246_255)] dark:bg-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
            <nav className="flex items-center gap-1 px-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                  href={item.href}
                  aria-current={item.isActive(pathname) ? "page" : undefined}
                  className={classNames(
                    linkBase,
                    "inline-flex items-center gap-2",
                    item.isActive(pathname) && linkActive
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
                );
              })}
            </nav>
            </div>
          </div>
          <div className="flex items-center gap-2 ms-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>

        {/* Mobile actions (left side in RTL) */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        id="topnav-menu"
        className={classNames(
          "md:hidden border-t",
          open ? "block" : "hidden"
        )}
      >
        <nav className="container py-2 flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={item.isActive(pathname) ? "page" : undefined}
                className={classNames(
                  linkBase,
                  "w-full text-right inline-flex items-center gap-2",
                  item.isActive(pathname) && linkActive
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
