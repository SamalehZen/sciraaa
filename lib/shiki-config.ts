import { createHighlighter, type BundledLanguage, type BundledTheme, type Highlighter } from 'shiki';

const themes: [BundledTheme, BundledTheme] = ['github-light', 'github-dark'];

const languages: BundledLanguage[] = [
  'bash',
  'c',
  'cpp',
  'css',
  'diff',
  'dockerfile',
  'go',
  'graphql',
  'html',
  'java',
  'javascript',
  'json',
  'kotlin',
  'latex',
  'markdown',
  'php',
  'python',
  'r',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'toml',
  'tsx',
  'typescript',
  'yaml',
];

let highlighterPromise: Promise<Highlighter> | undefined;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes, langs: languages });
  }
  return highlighterPromise;
}

export async function highlightCodeToHtml(code: string, language: string, theme: BundledTheme) {
  const highlighter = await getHighlighter();
  const normalized = language?.toLowerCase() ?? '';
  const target = languages.includes(normalized as BundledLanguage)
    ? (normalized as BundledLanguage)
    : ('plaintext' as BundledLanguage);

  return highlighter.codeToHtml(code, { lang: target, theme });
}

export const shikiThemes = themes;
export type ShikiThemePair = typeof themes;
