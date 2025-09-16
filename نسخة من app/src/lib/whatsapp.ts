export function toE164KSA(input: string): string {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (/^9665\d{8}$/.test(digits)) return digits;
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`; // drop leading 0
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  return ""; // غير صالح
}

export function renderTemplate(template: string, params: Record<string, string | number>): string {
  const injected = template.replace(/\{(\w+)\}/g, (_, k) => String(params?.[k] ?? ""));
  return encodeURIComponent(injected);
}

export function buildWhatsAppLink(phone: string, template: string, params: Record<string, string | number>): string {
  const e164 = toE164KSA(phone);
  const text = renderTemplate(template, params);
  if (!e164) return "";
  return `https://wa.me/${e164}?text=${text}`;
}

