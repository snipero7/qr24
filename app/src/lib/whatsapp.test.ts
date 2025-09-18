import { describe, it, expect } from 'vitest';
import { toE164KSA, buildWhatsAppLink } from './whatsapp';

describe('toE164KSA', () => {
  it('converts 05xxxxxxxx to 9665xxxxxxxx', () => {
    expect(toE164KSA('0551234567')).toBe('966551234567');
  });
  it('converts 5xxxxxxxx to 9665xxxxxxxx', () => {
    expect(toE164KSA('512345678')).toBe('966512345678');
  });
  it('keeps 9665xxxxxxxx as is', () => {
    expect(toE164KSA('966512345678')).toBe('966512345678');
  });
  it('converts Arabic-Indic digits to Latin before validation', () => {
    expect(toE164KSA('٠٥٥١٢٣٤٥٦٧')).toBe('966551234567');
    expect(toE164KSA('٩٦٦٥١٢٣٤٥٦٧٨')).toBe('966512345678');
  });
  it('returns empty for invalid', () => {
    expect(toE164KSA('123')).toBe('');
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a valid wa.me link', () => {
    const url = buildWhatsAppLink('0551234567', 'Hello {name}', { name: 'Ali' });
    expect(url.startsWith('https://wa.me/966551234567?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Hello Ali');
  });
});
