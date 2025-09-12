import { describe, it, expect } from 'vitest';
import { shouldRunBackup } from './settings';

describe('shouldRunBackup', () => {
  it('matches same UTC weekday and hour', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 10));
    expect(shouldRunBackup(d as any, d.getUTCDay(), d.getUTCHours())).toBe(true);
  });
  it('mismatch hour returns false', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 10));
    expect(shouldRunBackup(d as any, d.getUTCDay(), 11)).toBe(false);
  });
  it('mismatch weekday returns false', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 10));
    const wd = (d.getUTCDay() + 1) % 7;
    expect(shouldRunBackup(d as any, wd, d.getUTCHours())).toBe(false);
  });
});

