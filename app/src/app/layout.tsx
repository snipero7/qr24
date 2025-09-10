import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "منصة إدارة الصيانة",
  description: "MVP لإدارة صيانة الجوالات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b bg-gray-50/50">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex gap-4">
            <a className="font-semibold" href="/dashboard">الرئيسية</a>
            <a href="/orders/new">طلب جديد</a>
            <a href="/track/demo12345">تتبع (تجريبي)</a>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
