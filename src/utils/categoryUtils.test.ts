import { describe, it, expect } from 'vitest';
import { CATEGORIES, getScopeForCategory, matchesCategory } from './categoryUtils';

describe('category filtering', () => {
  it('matches every holiday under "all"', () => {
    expect(matchesCategory({ type: 'observance' }, 'all')).toBe(true);
    expect(matchesCategory({ type: 'public' }, undefined)).toBe(true);
  });

  it('keeps statutory days out of the cultural and seasonal buckets', () => {
    const publicHoliday = { type: 'public' };

    expect(matchesCategory(publicHoliday, 'public')).toBe(true);
    expect(matchesCategory(publicHoliday, 'cultural')).toBe(false);
    expect(matchesCategory(publicHoliday, 'astronomical')).toBe(false);
  });

  it('groups religious, cultural and observance days as cultural', () => {
    ['religious', 'cultural', 'observance'].forEach(type => {
      expect(matchesCategory({ type }, 'cultural')).toBe(true);
    });
  });

  it('routes seasonal days to the astronomical chip', () => {
    expect(matchesCategory({ type: 'seasonal' }, 'astronomical')).toBe(true);
    expect(matchesCategory({ type: 'cultural', subtype: 'solar-term' }, 'astronomical')).toBe(true);
  });

  it('only asks the API for extended data when the category needs it', () => {
    expect(getScopeForCategory('public')).toBe('public');
    ['all', 'cultural', 'astronomical'].forEach(category => {
      expect(getScopeForCategory(category)).toBe('all');
    });
  });

  it('exposes a category chip for each filter the scope logic knows', () => {
    expect(CATEGORIES.map(category => category.id)).toEqual(['all', 'public', 'cultural', 'astronomical']);
  });
});
