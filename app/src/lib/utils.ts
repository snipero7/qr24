import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

// Normalize Arabic-Indic and Extended Arabic-Indic digits to ASCII, and common separators
export function normalizeNumberInput(input: string): string {
  if (!input) return "";
  let s = String(input);
  // Map Arabic-Indic (U+0660–0669) and Extended Arabic-Indic (U+06F0–06F9) to ASCII
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  s = s.replace(/[٠-٩۰-۹]/g, (ch) => map[ch] ?? ch);
  // Replace Arabic decimal separator (U+066B) with dot
  s = s.replace(/[٫]/g, ".");
  // Remove thousand separators: Arabic thousands (U+066C), Arabic comma (U+060C), regular comma and spaces
  s = s.replace(/[٬،,\s]/g, "");
  // Keep only digits and at most one dot
  let cleaned = "";
  let dotSeen = false;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') { cleaned += ch; continue; }
    if (ch === '.') { if (!dotSeen) { cleaned += ch; dotSeen = true; } continue; }
  }
  return cleaned;
}
