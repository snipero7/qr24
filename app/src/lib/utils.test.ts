import { describe, it, expect } from 'vitest';
import { normalizeNumberInput } from './utils';

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

