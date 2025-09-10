"use client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { templates, storeConfig, TemplateKey } from "@/config/notifications";

export function WhatsAppButton({ phone, templateKey, params }: { phone?: string | null; templateKey: TemplateKey; params: Record<string, string | number> }) {
  const tpl = templates[templateKey];
  const href = phone ? buildWhatsAppLink(phone, tpl, { ...params, ...storeConfig }) : "";
  const valid = Boolean(href);
  return (
    <a
      className={`border rounded px-2 py-1 text-xs ${valid ? "hover:bg-green-50" : "opacity-50 pointer-events-none"}`}
      href={valid ? href : undefined}
      target="_blank"
      rel="noopener noreferrer"
      title={valid ? "إرسال واتساب" : "رقم غير صالح"}
    >
      واتساب
    </a>
  );
}

