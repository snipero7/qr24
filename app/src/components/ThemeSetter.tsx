"use client";

import { useEffect } from "react";

type Theme = "light" | "dark";

type ThemeSetterProps = {
  theme: Theme;
  persist?: boolean;
};

export function ThemeSetter({ theme, persist = false }: ThemeSetterProps) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.classList.remove("light", "dark");
    html.classList.add(theme);
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        /* ignore storage errors */
      }
    }
  }, [theme, persist]);

  return null;
}
