"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.removeAttribute("data-theme");
    html.classList.remove('dark','light');
    if (t === "dark") { html.setAttribute("data-theme", "dark"); html.classList.add('dark'); }
    else if (t === "light") { html.setAttribute("data-theme", "light"); html.classList.add('light'); }
    // system => no attribute/class, falls back to prefers-color-scheme
  }

  function change(t: Theme) {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }

  return (
    <div className="ms-auto flex items-center gap-1 text-sm">
      <button className={btn(theme==='light')} onClick={()=>change('light')}>فاتح</button>
      <button className={btn(theme==='dark')} onClick={()=>change('dark')}>داكن</button>
      <button className={btn(theme==='system')} onClick={()=>change('system')}>نظام</button>
    </div>
  );
}

function btn(active: boolean) {
  return `border rounded px-2 py-1 ${active? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-black' : 'bg-white hover:bg-gray-50'}`;
}
