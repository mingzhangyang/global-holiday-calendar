import { describe, it, expect } from 'vitest';
import { compactDate, escapeIcsText, foldLine, nextDayCompact } from './ics-format.js';

const octets = value => new TextEncoder().encode(value).length;

describe('escapeIcsText', () => {
  it('escapes the characters RFC 5545 reserves in a TEXT value', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('compact dates', () => {
  it('formats a date and its exclusive end date', () => {
    expect(compactDate('2026-01-01')).toBe('20260101');
    expect(nextDayCompact('2026-01-31')).toBe('20260201');
    expect(nextDayCompact('2026-12-31')).toBe('20270101');
  });
});

describe('foldLine', () => {
  it('leaves a short line alone', () => {
    expect(foldLine('SUMMARY:New Year')).toBe('SUMMARY:New Year');
  });

  it('folds on octets, not characters', () => {
    // 40 CJK characters is 120 octets but only 40 code units, so a
    // length-based fold would emit this line unfolded and over the limit.
    const line = `SUMMARY:${'中'.repeat(40)}`;
    const folded = foldLine(line);

    expect(folded).toContain('\r\n ');
    folded.split('\r\n').forEach(part => {
      expect(octets(part)).toBeLessThanOrEqual(75);
    });
  });

  it('never splits a surrogate pair', () => {
    const folded = foldLine(`SUMMARY:${'🎆'.repeat(30)}`);

    expect(folded).not.toContain('�');
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'🎆'.repeat(30)}`);
    folded.split('\r\n').forEach(part => {
      expect(octets(part)).toBeLessThanOrEqual(75);
    });
  });

  it('keeps every continuation line under the limit including its space', () => {
    const folded = foldLine(`DESCRIPTION:${'a'.repeat(300)}`);
    const parts = folded.split('\r\n');

    expect(parts.length).toBeGreaterThan(1);
    parts.slice(1).forEach(part => {
      expect(part.startsWith(' ')).toBe(true);
      expect(octets(part)).toBeLessThanOrEqual(75);
    });
    expect(parts.join('').replace(/^ | /g, '')).toContain('a'.repeat(50));
  });
});
