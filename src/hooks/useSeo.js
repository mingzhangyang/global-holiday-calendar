import { useEffect } from 'react';

function upsertMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export function useSeo({
  title,
  description,
  language,
  canonical,
  image,
  locale,
  structuredData
}) {
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

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    let structuredDataScript = document.head.querySelector('#dynamic-seo-structured-data');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      structuredDataScript.setAttribute('id', 'dynamic-seo-structured-data');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);
  }, [title, description, language, canonical, image, locale, structuredData]);
}
