"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
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
  Settings,
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

type TopNavProps = {
  initialName?: string;
  initialLogo?: string | null;
};

function normalizeLogo(src: string | undefined, fallback: string) {
  if (!src) return fallback;
  return src.startsWith("http") || src.startsWith("/") ? src : `/${src}`;
}

export default function TopNav({ initialName, initialLogo }: TopNavProps = {}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const envStoreName = process.env.NEXT_PUBLIC_STORE_NAME || "منصة الصيانة";
  const envLogo = process.env.NEXT_PUBLIC_STORE_LOGO as string | undefined;
  const envLogoSrc = normalizeLogo(envLogo, "/logo-placeholder.svg");
  const [brand, setBrand] = useState<{ name: string; logo: string }>(() => ({
    name: initialName || envStoreName,
    logo: normalizeLogo(initialLogo ?? envLogo, envLogoSrc),
  }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        const name = data?.storeName || envStoreName;
        const logo = normalizeLogo((data?.storeLogoUrl as string | undefined) || envLogo, envLogoSrc);
        if (mounted) setBrand({ name, logo });
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [envStoreName, envLogoSrc, envLogo]);

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
      {
        href: "/settings",
        label: "الإعدادات",
        icon: Settings,
        isActive: (p) => p.startsWith("/settings"),
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
      <div className="flex h-14 w-full items-center justify-between gap-4 px-0 sm:px-3">
        {/* Right side (brand + toggler in RTL) */}
        <div className="flex items-center gap-3 shrink-0 justify-end">
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
            <span className="inline-flex h-16 w-36 items-center justify-end overflow-hidden rounded-2xl border border-black/5 bg-white/80 px-7 dark:border-white/10 dark:bg-white/10">
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-14 w-auto max-w-[280px] object-contain"
              />
            </span>
            <span>{brand.name}</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex flex-1 justify-center">
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

        {/* Desktop actions (left side in RTL) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <UserNav />
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
