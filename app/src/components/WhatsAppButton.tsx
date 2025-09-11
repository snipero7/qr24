"use client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { templates, storeConfig, TemplateKey, describeTemplate } from "@/config/notifications";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path fill="currentColor" d="M16 3C9.373 3 4 8.373 4 15c0 2.12.55 4.108 1.51 5.84L4 29l8.34-1.47A11.9 11.9 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3Zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10a9.9 9.9 0 0 1-4.9-1.31l-.35-.19-4.62.81.82-4.5-.2-.36A9.9 9.9 0 0 1 6 15c0-5.523 4.477-10 10-10Zm-5.08 5.77c.17-.01.36.01.56.05.2.03.44.07.68.55.26.5.83 1.74.9 1.86.07.13.11.28.02.45-.08.17-.12.27-.24.42-.12.14-.25.32-.36.43-.12.12-.24.25-.1.48.14.24.62 1.02 1.33 1.65.92.81 1.71 1.06 1.95 1.18.24.12.39.1.54-.05.15-.15.63-.73.8-.98.17-.24.34-.2.56-.12.22.07 1.39.66 1.63.78.24.12.4.18.46.28.06.1.06.57-.13 1.12-.2.55-1.15 1.06-1.58 1.1-.43.05-.98.07-1.58-.1-.6-.17-1.38-.45-2.35-1.05-.97-.6-1.9-1.55-2.2-1.94-.3-.4-.73-.94-.97-1.58-.24-.64-.26-1.18-.18-1.62.07-.43.31-.99.62-1.37.31-.39.69-.39.9-.4Z"/>
    </svg>
  );
}

export function WhatsAppButton({ phone, templateKey, params, variant = "icon" }: { phone?: string | null; templateKey: TemplateKey; params: Record<string, string | number>; variant?: "icon" | "text" }) {
  const tpl = templates[templateKey];
  const href = phone ? buildWhatsAppLink(phone, tpl, { ...params, ...storeConfig }) : "";
  const valid = Boolean(href);
  const title = valid ? describeTemplate(templateKey) : "رقم غير صالح";
  const base = "inline-flex items-center justify-center border transition-colors";
  const cls = variant === "icon"
    ? `${base} w-8 h-8 rounded-full ${valid ? "border-green-600/30 hover:bg-green-50 dark:hover:bg-green-900/20" : "opacity-50 pointer-events-none"}`
    : `${base} text-xs px-2 py-1 rounded ${valid ? "hover:bg-green-50" : "opacity-50 pointer-events-none"}`;
  return (
    <a
      className={cls}
      href={valid ? href : undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      title={title}
    >
      {variant === "icon" ? (
        <WhatsAppIcon className={`w-4 h-4 ${valid ? "text-green-600" : "text-gray-400"}`} />
      ) : (
        <span>واتساب</span>
      )}
    </a>
  );
}
