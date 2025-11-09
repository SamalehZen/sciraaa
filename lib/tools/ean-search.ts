import { tool } from 'ai';
import type { UIMessageStreamWriter } from 'ai';
import { z } from 'zod';

import { serverEnv } from '@/env/server';

import type { ChatMessage } from '../types';

type ProductSearchResult = {
  title: string;
  url: string;
  content: string;
  price?: string;
  images: string[];
  supplier?: string;
  ean: string;
  publishedDate?: string;
  favicon?: string;
};

type GoogleAIProductData = {
  description?: string;
  images: string[];
  results: ProductSearchResult[];
};

function ensureSnippet(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function buildDescription(textBlocks: unknown): string | undefined {
  if (!Array.isArray(textBlocks)) {
    return undefined;
  }

  const parts: string[] = [];

  for (const block of textBlocks) {
    if (!block || typeof block !== 'object') {
      continue;
    }

    const type = (block as any).type;

    if (type === 'paragraph' || type === 'conversation') {
      const snippet = ensureSnippet((block as any).snippet);
      if (snippet) {
        parts.push(snippet);
      }
      continue;
    }

    if (type === 'heading') {
      const snippet = ensureSnippet((block as any).snippet);
      if (snippet) {
        parts.push(snippet);
      }
      continue;
    }

    if ((type === 'list' || type === 'bulleted_list') && Array.isArray((block as any).items)) {
      const items = (block as any).items
        .map((item: any) => ensureSnippet(item?.snippet))
        .filter(Boolean) as string[];

      if (items.length > 0) {
        const formatted = items
          .map((entry, index) => (type === 'bulleted_list' ? `• ${entry}` : `${index + 1}. ${entry}`))
          .join('\n');
        parts.push(formatted);
      }
    }
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join('\n\n');
}

function collectImages(data: any): string[] {
  const images = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        images.add(trimmed);
      }
    }
  };

  if (Array.isArray(data?.shopping_results)) {
    for (const item of data.shopping_results) {
      if (!item || typeof item !== 'object') continue;
      push((item as any).thumbnail);
      if (Array.isArray((item as any).images)) {
        for (const image of (item as any).images) {
          push(image);
        }
      }
    }
  }

  if (Array.isArray(data?.inline_images)) {
    for (const image of data.inline_images) {
      push((image as any).original);
      push((image as any).thumbnail);
      push((image as any).image);
    }
  }

  if (Array.isArray(data?.images_results)) {
    for (const image of data.images_results) {
      push((image as any).original);
      push((image as any).thumbnail);
      push((image as any).image);
    }
  }

  if (Array.isArray(data?.image_results)) {
    for (const image of data.image_results) {
      push((image as any).original);
      push((image as any).thumbnail);
      push((image as any).image);
    }
  }

  if (Array.isArray(data?.text_blocks)) {
    for (const block of data.text_blocks) {
      if (!block || typeof block !== 'object') continue;
      push((block as any).image);
      if (Array.isArray((block as any).images)) {
        for (const image of (block as any).images) {
          push(image);
        }
      }
    }
  }

  return Array.from(images).slice(0, 12);
}

function buildShoppingResults(barcode: string, shoppingResults: unknown): ProductSearchResult[] {
  if (!Array.isArray(shoppingResults)) {
    return [];
  }

  const seenUrls = new Set<string>();
  const results: ProductSearchResult[] = [];

  for (const raw of shoppingResults) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const item = raw as any;
    const url = ensureSnippet(item.product_link) || ensureSnippet(item.link);
    if (!url || seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);

    const contentParts: string[] = [];
    const price = ensureSnippet(item.price);
    if (price) {
      contentParts.push(`Prix: ${price}`);
    }

    if (typeof item.rating === 'number') {
      const ratingValue = item.rating.toFixed(1);
      const reviewsCount = typeof item.reviews === 'number' ? item.reviews : undefined;
      contentParts.push(`Note: ${ratingValue}/5${reviewsCount ? ` (${reviewsCount} avis)` : ''}`);
    }

    const availability = ensureSnippet(item.availability) || ensureSnippet(item.shipping) || ensureSnippet(item.delivery);
    if (availability) {
      contentParts.push(availability);
    }

    const supplier = ensureSnippet(item.store) || ensureSnippet(item.source) || getHostname(url) || undefined;

    results.push({
      title: ensureSnippet(item.title) || 'Produit Google',
      url,
      content: contentParts.join(' • '),
      price: price || undefined,
      images: [],
      supplier,
      ean: barcode,
      favicon: undefined,
    });

    if (results.length >= 8) {
      break;
    }
  }

  return results;
}

async function fetchGoogleAIProductData(barcode: string): Promise<GoogleAIProductData> {
  try {
    const response = await fetch(
      `https://serpapi.com/search?engine=google_ai_mode&q=EAN+${barcode}&api_key=${serverEnv.SERPAPI_API_KEY}`,
    );

    if (!response.ok) {
      console.error('SerpAPI Google AI Mode error:', response.status, response.statusText);
      return { description: undefined, images: [], results: [] };
    }

    const data = await response.json();

    const description = buildDescription(data?.text_blocks);
    const images = collectImages(data);
    const results = buildShoppingResults(barcode, data?.shopping_results);

    return {
      description,
      images,
      results,
    };
  } catch (error) {
    console.error('Error fetching Google AI Mode data:', error);
    return { description: undefined, images: [], results: [] };
  }
}

export function eanSearchTool(dataStream: UIMessageStreamWriter<ChatMessage> | undefined) {
  return tool({
    description:
      'Search for product information using EAN/UPC barcode. Returns detailed product information including title, description, images, price, and suppliers. Use this tool when the user provides a barcode number (13 digits for EAN-13, 8 digits for EAN-8, or 12 digits for UPC).',
    inputSchema: z.object({
      barcode: z.string().describe('The EAN/UPC barcode number provided by the user'),
    }),
    execute: async ({ barcode }) => {
      if (!/^\d{8,13}$/.test(barcode)) {
        throw new Error('Invalid barcode format. EAN codes must be 8-13 digits.');
      }

      try {
        const { description, images, results } = await fetchGoogleAIProductData(barcode);
        const totalResults = results.length;

        if (!description && totalResults === 0 && images.length === 0) {
          return {
            barcode,
            results: [],
            images: [],
            totalResults: 0,
            aiDescription: undefined,
            message: `Aucune information disponible via Google AI Mode pour le code-barres ${barcode}.`,
          } as const;
        }

        return {
          barcode,
          results,
          images,
          totalResults,
          aiDescription: description,
          message: description
            ? `Description générée via Google AI Mode pour le code-barres ${barcode}.`
            : `Informations issues de Google AI Mode pour le code-barres ${barcode}.`,
        };
      } catch (err) {
        return {
          barcode,
          results: [],
          images: [],
          totalResults: 0,
          aiDescription: undefined,
          message: 'Impossible de récupérer les informations via Google AI Mode.',
          error: (err as Error)?.message || 'Unknown error',
        } as const;
      }
    },
  });
}
