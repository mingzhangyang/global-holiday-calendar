// Cultural trivia is content, not code: it is fetched per language on demand
// so eight languages' worth of prose never rides along in the main bundle.

export interface TriviaEntry {
  id: string;
  title: string;
  countryCode: string;
  customs: string;
}

const LOADERS: Record<string, () => Promise<{ default: TriviaEntry[] }>> = {
  en: () => import('./en.js'),
  'zh-CN': () => import('./zh-CN.js')
};

const cache = new Map<string, Promise<TriviaEntry[]>>();

/**
 * Trivia for a language, falling back to English for languages that have not
 * been translated yet.
 */
export async function loadTrivia(language = 'en'): Promise<TriviaEntry[]> {
  const key = LOADERS[language] ? language : 'en';

  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const promise = LOADERS[key]()
    .then(module => module.default)
    .catch(error => {
      console.warn(`Failed to load ${key} trivia:`, error);
      cache.delete(key);
      return key === 'en' ? [] : loadTrivia('en');
    });

  cache.set(key, promise);
  return promise;
}
