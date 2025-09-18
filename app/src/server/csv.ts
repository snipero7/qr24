type HeaderDescriptor = string | { key: string; label: string };

export function toCsv(rows: Record<string, any>[], headers?: HeaderDescriptor[]) {
  if (!rows.length) return "";
  const cols = headers ?? Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const keys = cols.map((c) => (typeof c === "string" ? c : c.key));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const headerLine = cols.map((c) => (typeof c === "string" ? c : c.label)).join(",");
  const lines = [headerLine];
  for (const r of rows) lines.push(keys.map((k) => esc(r[k])).join(","));
  return lines.join("\n");
}

export function toExcelHtml(rows: Record<string, any>[], headers?: HeaderDescriptor[]) {
  if (!rows.length) {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\" /></head><body><table></table></body></html>";
  }
  const cols = headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const keys = cols.map((c) => (typeof c === "string" ? c : c.key));
  const esc = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  const head = `<tr>${cols
    .map((c) => `<th style="text-align:right;padding:6px;border:1px solid #d1d5db;background:#f1f5f9;">${esc(typeof c === "string" ? c : c.label)}</th>`)
    .join("")}</tr>`;
  const body = rows
    .map((row) => `<tr>${keys.map((k) => `<td style="text-align:right;padding:6px;border:1px solid #e5e7eb;">${esc(row[k])}</td>`).join("")}</tr>`)
    .join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>Export</title></head><body><table style="border-collapse:collapse;font-family:system-ui,\"Segoe UI\",Helvetica,Arial,sans-serif;font-size:13px;">${head}${body}</table></body></html>`;
}
