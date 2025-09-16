import { ThemeSetter } from "@/components/ThemeSetter";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeSetter theme="light" />
      {children}
    </>
  );
}
