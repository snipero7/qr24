import AutoRefresh from "@/components/AutoRefresh";
import TopNav from "@/components/layout/TopNav";
import { ThemeSetter } from "@/components/ThemeSetter";
import { getAuthSession } from "@/server/auth";
import { getSettings } from "@/server/settings";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/signin");
  }
  const settings = await getSettings();
  const theme = settings?.uiTheme === "dark" ? "dark" : "light";
  const brandName = settings?.storeName ?? undefined;
  const brandLogo = settings?.storeLogoUrl ?? undefined;

  return (
    <>
      <ThemeSetter theme={theme} persist />
      <AutoRefresh intervalMs={15000} />
      <TopNav initialName={brandName} initialLogo={brandLogo} />
      <main className="container">{children}</main>
    </>
  );
}
