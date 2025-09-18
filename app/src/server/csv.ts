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
    .map((c) => `<th style="text-align:center;padding:12px;border:1px solid #bfd0ff;background:#1d4ed8;color:#fff;font-size:18px;font-weight:600;">${esc(typeof c === "string" ? c : c.label)}</th>`)
    .join("")}</tr>`;
  const body = rows
    .map((row, idx) => `<tr>${keys
      .map((k) => `<td style="text-align:center;padding:12px;border:1px solid #e2e8f0;font-size:16px;background:${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">${esc(row[k])}</td>`)
      .join("")}</tr>`)
    .join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>Export</title><style>
    body { font-family: 'Rubik', 'Cairo', system-ui, 'Segoe UI', sans-serif; background:#eef2ff; margin:0; padding:24px; }
    table { border-collapse:collapse; width:100%; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 20px 40px rgba(15,23,42,0.12); }
  </style></head><body><table>${head}${body}</table></body></html>`;
}
