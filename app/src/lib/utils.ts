import { twMerge } from "tailwind-merge";

const ARABIC_TO_LATIN_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

const DIGIT_REGEX = /[٠-٩۰-۹]/g;

export function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

// Convert Arabic-Indic digits (and common separators) to their Latin counterparts without stripping other characters
export function toLatinDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(DIGIT_REGEX, (ch) => ARABIC_TO_LATIN_DIGITS[ch] ?? ch)
    .replace(/[٫]/g, ".")
    .replace(/[٬،]/g, ",");
}

// Normalize Arabic-Indic and Extended Arabic-Indic digits to ASCII, and common separators
export function normalizeNumberInput(input: string): string {
  if (!input) return "";
  let s = toLatinDigits(input);
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
