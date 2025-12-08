import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine les classes CSS avec clsx et merge avec tailwind-merge
 * pour éviter les conflits de classes Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Types et interfaces utilitaires
 */
export type SearchGroupId = 'web' | 'academic' | 'code' | 'video' | 'news' | 'shopping' | 'local';

export interface SearchGroup {
  id: SearchGroupId;
  label: string;
  icon?: any;
  description?: string;
}

export type SearchProvider = 'exa' | 'parallel' | 'tavily' | 'firecrawl';

/**
 * Fonction pour obtenir les groupes de recherche
 */
export function getSearchGroups(): SearchGroup[] {
  return [
    { id: 'web', label: 'Web', description: 'Recherche web générale' },
    { id: 'academic', label: 'Academic', description: 'Articles académiques' },
    { id: 'code', label: 'Code', description: 'Recherche de code' },
    { id: 'video', label: 'Video', description: 'Vidéos' },
    { id: 'news', label: 'News', description: 'Actualités' },
    { id: 'shopping', label: 'Shopping', description: 'Shopping' },
    { id: 'local', label: 'Local', description: 'Recherche locale' },
  ];
}

/**
 * Formatte une date de manière relative (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'à l\'instant';
  if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
  
  return past.toLocaleDateString();
}

/**
 * Valide si une chaîne est un email valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Génère un ID aléatoire
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Formatte les bytes en format lisible (ex: 1.5 MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Invalide le cache des chats (à adapter selon votre implémentation)
 */
export function invalidateChatsCache(): void {
  // Implémentez votre logique de cache invalidation ici
  console.log('Cache invalidated');
}
