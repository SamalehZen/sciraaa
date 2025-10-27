// Search limits for free users
export const SEARCH_LIMITS = {
  DAILY_SEARCH_LIMIT: 5,
  EXTREME_SEARCH_LIMIT: 5,
} as const;

export const PRICING = {
  PRO_MONTHLY: 15, // USD
  PRO_MONTHLY_INR: 1299, // INR for Indian users
} as const;

export const CURRENCIES = {
  USD: 'USD',
  INR: 'INR',
} as const;

export const SNAPSHOT_NAME = 'scira-analysis:1752127473';

// Available agents in the system
export const AVAILABLE_AGENTS = [
  'web',
  'x',
  'academic',
  'youtube',
  'reddit',
  'stocks',
  'chat',
  'extreme',
  'memory',
  'crypto',
  'code',
  'connectors',
  'cyrus',
  'libeller',
  'nomenclature',
  'pdfExcel'
] as const;
