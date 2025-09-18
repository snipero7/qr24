export function toCsv(rows: Record<string, any>[], headers?: string[]) {
  if (!rows.length) return "";
  const cols = headers ?? Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map(c => esc(r[c])).join(","));
  return lines.join("\n");
}

export function toExcelHtml(rows: Record<string, any>[], headers?: string[]) {
  if (!rows.length) {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\" /></head><body><table></table></body></html>";
  }
  const cols = headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  const head = `<tr>${cols.map((c) => `<th style="text-align:right;padding:6px;border:1px solid #d1d5db;background:#f1f5f9;">${esc(c)}</th>`).join("")}</tr>`;
  const body = rows
    .map((row) => `<tr>${cols.map((c) => `<td style="text-align:right;padding:6px;border:1px solid #e5e7eb;">${esc(row[c])}</td>`).join("")}</tr>`)
    .join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>Export</title></head><body><table style="border-collapse:collapse;font-family:system-ui,\"Segoe UI\",Helvetica,Arial,sans-serif;font-size:13px;">${head}${body}</table></body></html>`;
}
