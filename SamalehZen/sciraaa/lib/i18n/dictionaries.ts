export async function loadDictionary(locale: 'fr' | 'en'): Promise<Record<string, string>> {
  switch (locale) {
    case 'en':
      return (await import('../../locales/en.json')).default as Record<string, string>;
    case 'fr':
    default:
      return (await import('../../locales/fr.json')).default as Record<string, string>;
  }
}

export async function loadFallback(): Promise<Record<string, string>> {
  return (await import('../../locales/fr.json')).default as Record<string, string>;
}
