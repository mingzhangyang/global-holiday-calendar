import { describe, it, expect, beforeEach } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  getLanguageFromRegion,
  getLanguageDisplayName,
  getLocaleFromLanguage,
  getSupportedLanguages,
  setUserLanguage,
  getUserLanguage
} from './i18nService';

describe('i18nService', () => {
  beforeEach(() => {
    let store = {};
    const mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };

    globalThis.window = {
      localStorage: mockStorage
    };
    globalThis.localStorage = mockStorage;
  });

  it('maps regions to their primary language correctly', () => {
    expect(getLanguageFromRegion('US')).toBe('en');
    expect(getLanguageFromRegion('GB')).toBe('en');
    expect(getLanguageFromRegion('FR')).toBe('fr');
    expect(getLanguageFromRegion('DE')).toBe('de');
    expect(getLanguageFromRegion('ES')).toBe('es');
    expect(getLanguageFromRegion('MX')).toBe('es');
    expect(getLanguageFromRegion('CN')).toBe('zh-CN');
    expect(getLanguageFromRegion('TW')).toBe('zh-TW');
    expect(getLanguageFromRegion('JP')).toBe('ja');
    expect(getLanguageFromRegion('KR')).toBe('ko');
    // Unknown region defaults to 'en'
    expect(getLanguageFromRegion('UNKNOWN')).toBe('en');
    expect(getLanguageFromRegion(null)).toBe('en');
  });

  it('returns valid locale strings for Intl formatting', () => {
    expect(getLocaleFromLanguage('en')).toBe('en-US');
    expect(getLocaleFromLanguage('fr')).toBe('fr-FR');
    expect(getLocaleFromLanguage('de')).toBe('de-DE');
    expect(getLocaleFromLanguage('es')).toBe('es-ES');
    expect(getLocaleFromLanguage('zh-CN')).toBe('zh-CN');
    expect(getLocaleFromLanguage('zh-TW')).toBe('zh-TW');
    expect(getLocaleFromLanguage('ja')).toBe('ja-JP');
    expect(getLocaleFromLanguage('ko')).toBe('ko-KR');
    expect(getLocaleFromLanguage('unsupported')).toBe('en-US');
  });

  it('returns display names for supported languages', () => {
    expect(getLanguageDisplayName('en')).toBe('English');
    expect(getLanguageDisplayName('zh-CN')).toBe('简体中文');
    expect(getLanguageDisplayName('fr')).toBe('Français');
    expect(getLanguageDisplayName('ja')).toBe('日本語');
  });

  it('returns structured array of supported languages', () => {
    const supported = getSupportedLanguages();
    expect(supported.length).toBe(Object.keys(SUPPORTED_LANGUAGES).length);
    expect(supported.map(s => s.code)).toEqual(['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko']);
  });

  it('persists and retrieves user language preference from localStorage', () => {
    expect(setUserLanguage('de')).toBe(true);
    expect(window.localStorage.getItem('preferred-language')).toBe('de');
    expect(getUserLanguage()).toBe('de');

    // Invalid language code should be rejected
    expect(setUserLanguage('invalid-code')).toBe(false);
  });
});
