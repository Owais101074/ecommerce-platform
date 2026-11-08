import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatPrice, initials } from './format';

describe('formatPrice', () => {
  it('converts paise to a whole-rupee INR string', () => {
    expect(formatPrice(54_900)).toBe('₹549');
    expect(formatPrice(9_990_000)).toBe('₹99,900');
    expect(formatPrice(0)).toBe('₹0');
  });
});

describe('formatDate', () => {
  it('formats valid dates and falls back for invalid input', () => {
    expect(formatDate('2026-11-09T00:00:00.000Z')).toContain('2026');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });
});

describe('initials', () => {
  it('uses at most the first two name parts', () => {
    expect(initials('Asha Rao')).toBe('AR');
    expect(initials('  asha   rao  ')).toBe('AR');
    expect(initials('Prince')).toBe('P');
    expect(initials('')).toBe('');
  });
});
