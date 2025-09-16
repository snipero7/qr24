import { describe, it, expect } from 'vitest';
import { normalizeNumberInput, toLatinDigits } from './utils';

describe('normalizeNumberInput', () => {
  it('converts Arabic-Indic digits', () => {
    expect(normalizeNumberInput('٤٠')).toBe('40');
    expect(normalizeNumberInput('۱۲۳')).toBe('123');
  });
  it('handles decimal separator Arabic (٫) and keeps one dot', () => {
    expect(normalizeNumberInput('٤٠٫٥')).toBe('40.5');
    expect(normalizeNumberInput('٤٠٫٥٫٦')).toBe('40.56');
  });
  it('removes thousands separators and spaces', () => {
    expect(normalizeNumberInput('١٬٢٣٤')).toBe('1234');
    expect(normalizeNumberInput('1,234 567')).toBe('1234567');
    expect(normalizeNumberInput('١،٢٣٤')).toBe('1234');
  });
  it('ignores non-numeric characters', () => {
    expect(normalizeNumberInput('سعر: ٥٠')).toBe('50');
  });
});

describe('toLatinDigits', () => {
  it('converts Arabic and Persian digits while keeping other characters', () => {
    expect(toLatinDigits('رقم ١٢٣٤')).toBe('رقم 1234');
    expect(toLatinDigits('۰۹۸۷٦٥')).toBe('098765');
  });
  it('converts separators to Latin equivalents', () => {
    expect(toLatinDigits('١٬٢٣٤٫٥')).toBe('1,234.5');
    expect(toLatinDigits('١،٢٣٤')).toBe('1,234');
  });
  it('returns empty string for nullish input', () => {
    expect(toLatinDigits(undefined)).toBe('');
    expect(toLatinDigits(null)).toBe('');
  });
});
