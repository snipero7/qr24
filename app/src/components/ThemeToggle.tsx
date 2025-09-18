"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved as Theme);
      applyTheme(saved as Theme);
      return;
    }
    // No saved preference: try settings first, then media query
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const uiTheme = (data?.uiTheme === "dark" ? "dark" : "light") as Theme;
          setTheme(uiTheme);
          applyTheme(uiTheme);
          return;
        }
      } catch {}
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    })();
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.setAttribute("data-theme", t);
    html.classList.remove("dark", "light");
    html.classList.add(t);
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن"}
      title={theme === "dark" ? "وضع فاتح" : "وضع داكن"}
      className="icon-ghost no-label h-10 w-10"
    >
      {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
