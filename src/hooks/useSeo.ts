import { useEffect } from 'react';

export interface AlternateLink {
  href: string;
  hreflang: string;
}

export interface SeoOptions {
  title: string;
  description: string;
  language: string;
  canonical: string;
  image: string;
  locale: string;
  structuredData: unknown;
  alternateLinks?: AlternateLink[];
}

function upsertMeta(selector: string, attributes: Record<string, string>, content: string): void {
  const existing = document.head.querySelector(selector);
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }

  const element = document.createElement('meta');
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  element.setAttribute('content', content);
  document.head.appendChild(element);
}

export function useSeo({
  title,
  description,
  language,
  canonical,
  image,
  locale,
  structuredData,
  alternateLinks = []
}: SeoOptions) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = title;
    document.documentElement.lang = language || 'en';

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, locale);
    upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title' }, title);
    upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description' }, description);
    upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image' }, image);

    let canonicalLink: HTMLLinkElement | null = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    document.head
      .querySelectorAll('link[data-seo-alternate="true"]')
      .forEach(link => link.remove());

    alternateLinks.forEach(({ href, hreflang }) => {
      const alternateLink = document.createElement('link');
      alternateLink.setAttribute('rel', 'alternate');
      alternateLink.setAttribute('hreflang', hreflang);
      alternateLink.setAttribute('href', href);
      alternateLink.setAttribute('data-seo-alternate', 'true');
      document.head.appendChild(alternateLink);
    });

    let structuredDataScript = document.head.querySelector('#dynamic-seo-structured-data');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      structuredDataScript.setAttribute('id', 'dynamic-seo-structured-data');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);
  }, [title, description, language, canonical, image, locale, structuredData, alternateLinks]);
}
