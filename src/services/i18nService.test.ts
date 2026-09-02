import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  detectUserLanguage,
  getLanguageFromRegion,
  getLanguageDisplayName,
  getLocaleFromLanguage,
  getSupportedLanguages,
  setUserLanguage,
  getUserLanguage
} from './i18nService';
import { installBrowserGlobals } from '../test/browserMocks';

describe('i18nService', () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Canada, Switzerland and Luxembourg are each claimed by two of the
  // supported languages; the answer has to be stated, not left to whichever
  // language happens to be declared last.
  it('resolves multilingual countries by their primary language', () => {
    expect(getLanguageFromRegion('CA')).toBe('en');
    expect(getLanguageFromRegion('CH')).toBe('de');
    expect(getLanguageFromRegion('LU')).toBe('fr');
  });

  it("prefers the visitor's own language over the country they are in", async () => {
    vi.stubGlobal('navigator', { language: 'en-CA', languages: ['en-CA', 'en'] });

    await expect(detectUserLanguage('CA')).resolves.toBe('en');
  });

  it('falls back to the region only when the browser asks for something unsupported', async () => {
    vi.stubGlobal('navigator', { language: 'sv-SE', languages: ['sv-SE'] });

    await expect(detectUserLanguage('JP')).resolves.toBe('ja');
    await expect(detectUserLanguage(null)).resolves.toBe('en');
  });

  it('lets a saved preference win over both', async () => {
    vi.stubGlobal('navigator', { language: 'ja-JP', languages: ['ja-JP'] });
    setUserLanguage('ko');

    await expect(detectUserLanguage('FR')).resolves.toBe('ko');
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
