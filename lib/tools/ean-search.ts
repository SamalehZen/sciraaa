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

type EANImageProvider = 'serpapi' | 'scrapingdog' | 'serper';

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

  const segments: string[] = [];

  for (const block of textBlocks) {
    if (!block || typeof block !== 'object') {
      continue;
    }

    const type = (block as any).type;

    if (type === 'paragraph' || type === 'conversation') {
      const snippet = ensureSnippet((block as any).snippet);
      if (snippet) {
        segments.push(snippet);
      }
      continue;
    }

    if (type === 'heading') {
      const snippet = ensureSnippet((block as any).snippet);
      if (snippet) {
        segments.push(snippet);
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
        segments.push(formatted);
      }
    }
  }

  if (segments.length === 0) {
    return undefined;
  }

  return segments.join('\n\n');
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

async function fetchGoogleImagesLight(barcode: string): Promise<string[]> {
  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_images_light');
    url.searchParams.set('q', `EAN ${barcode}`);
    url.searchParams.set('api_key', serverEnv.SERPAPI_API_KEY);
    url.searchParams.set('hl', 'fr');
    url.searchParams.set('gl', 'fr');
    url.searchParams.set('google_domain', 'google.fr');
    url.searchParams.set('device', 'desktop');
    url.searchParams.set('location', 'Paris,Île-de-France,France');
    url.searchParams.set('no_cache', 'true');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('SerpAPI Google Images Light error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data?.images_results)) {
      return [];
    }

    const images: string[] = [];
    for (const entry of data.images_results) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const value =
        ensureSnippet((entry as any).original) ||
        ensureSnippet((entry as any).image) ||
        ensureSnippet((entry as any).thumbnail) ||
        ensureSnippet((entry as any).serpapi_thumbnail);

      if (value) {
        images.push(value);
      }

      if (images.length >= 20) {
        break;
      }
    }

    return images;
  } catch (error) {
    console.error('Error fetching Google Images Light data:', error);
    return [];
  }
}

async function fetchScrapingdogImages(query: string): Promise<string[]> {
  try {
    const url = new URL('https://api.scrapingdog.com/google_images');
    url.searchParams.set('api_key', serverEnv.SCRAPINGDOG_API_KEY);
    url.searchParams.set('query', query);
    url.searchParams.set('domain', 'google.fr');
    url.searchParams.set('country', 'fr');
    url.searchParams.set('language', 'fr');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Scrapingdog Google Images API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data?.images_results)) {
      return [];
    }

    const images: string[] = [];
    for (const entry of data.images_results) {
      if (!entry || typeof entry !== 'object') continue;
      const value =
        ensureSnippet((entry as any).original) ||
        ensureSnippet((entry as any).image) ||
        ensureSnippet((entry as any).thumbnail);

      if (value) {
        images.push(value);
      }

      if (images.length >= 20) {
        break;
      }
    }

    return images;
  } catch (error) {
    console.error('Error fetching Scrapingdog Google Images data:', error);
    return [];
  }
}

async function fetchSerperImages(query: string): Promise<string[]> {
  try {
    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': serverEnv.SERPER_API_KEY,
      },
      body: JSON.stringify({ q: query, gl: 'fr', hl: 'fr' }),
    });

    if (!response.ok) {
      console.error('Serper.dev Google Images API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data?.images)) {
      return [];
    }

    const images: string[] = [];
    for (const entry of data.images) {
      if (!entry || typeof entry !== 'object') continue;
      const value =
        ensureSnippet((entry as any).imageUrl) ||
        ensureSnippet((entry as any).thumbnailUrl) ||
        ensureSnippet((entry as any).link);

      if (value) {
        images.push(value);
      }

      if (images.length >= 20) {
        break;
      }
    }

    return images;
  } catch (error) {
    console.error('Error fetching Serper.dev Google Images data:', error);
    return [];
  }
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

    const availability =
      ensureSnippet(item.availability) || ensureSnippet(item.shipping) || ensureSnippet(item.delivery);
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

function sanitizeDescription(barcode: string, description: string | undefined): string | undefined {
  if (!description) {
    return undefined;
  }

  const lower = description.toLowerCase();
  const rejectionPhrases = [
    'not currently a recognized',
    'not currently recognized',
    'unknown product',
    'aucun résultat',
    'no results',
    'no links between',
    'aucune information disponible',
    'unable to find',
  ];

  if (rejectionPhrases.some((phrase) => lower.includes(phrase))) {
    return undefined;
  }

  if (!description.includes(barcode)) {
    return `Le code-barres EAN ${barcode} correspond au produit suivant :\n\n${description}`;
  }

  return description;
}

async function fetchGoogleAIResponse(barcode: string, query: string) {
  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_ai_mode');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', serverEnv.SERPAPI_API_KEY);
    url.searchParams.set('hl', 'fr');
    url.searchParams.set('gl', 'fr');
    url.searchParams.set('google_domain', 'google.fr');
    url.searchParams.set('device', 'desktop');
    url.searchParams.set('location', 'Paris,Île-de-France,France');
    url.searchParams.set('no_cache', 'true');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('SerpAPI Google AI Mode error:', response.status, response.statusText, query);
      return {
        description: undefined,
        images: [],
        results: [],
      };
    }

    const data = await response.json();

    return {
      description: buildDescription(data?.text_blocks),
      images: collectImages(data),
      results: buildShoppingResults(barcode, data?.shopping_results),
    };
  } catch (error) {
    console.error('Error fetching Google AI Mode data:', error, query);
    return {
      description: undefined,
      images: [],
      results: [],
    };
  }
}

async function fetchGoogleAIProductData(barcode: string, imageProvider: EANImageProvider) {
  const queryVariants = [
    `EAN ${barcode}`,
    `Code-barres ${barcode}`,
    `${barcode} produit`,
    `${barcode} description détaillée`,
    `${barcode} Carrefour`,
  ];

  const aggregatedImages = new Set<string>();
  const aggregatedResults = new Map<string, ProductSearchResult>();
  let bestDescription: string | undefined;

  const imagesLightPromise = imageProvider === 'serpapi' ? fetchGoogleImagesLight(barcode) : Promise.resolve<string[]>([]);

  for (const query of queryVariants) {
    const { description, images, results } = await fetchGoogleAIResponse(barcode, query);

    images.forEach((img) => aggregatedImages.add(img));
    results.forEach((result) => {
      if (!aggregatedResults.has(result.url)) {
        aggregatedResults.set(result.url, result);
      }
    });

    const sanitized = sanitizeDescription(barcode, description);
    if (!bestDescription && sanitized) {
      bestDescription = sanitized;
    }

    if (bestDescription && aggregatedImages.size >= 4 && aggregatedResults.size >= 3) {
      break;
    }
  }

  if (imageProvider === 'scrapingdog') {
    const scrapingdogImages = await fetchScrapingdogImages(`EAN ${barcode}`);
    scrapingdogImages.forEach((img) => aggregatedImages.add(img));
  }

  if (imageProvider === 'serper') {
    const serperImages = await fetchSerperImages(`EAN ${barcode}`);
    serperImages.forEach((img) => aggregatedImages.add(img));
  }

  const lightImages = await imagesLightPromise;
  lightImages.forEach((img) => aggregatedImages.add(img));

  const finalResults = Array.from(aggregatedResults.values()).slice(0, 8);
  const finalImages = Array.from(aggregatedImages).slice(0, 12);

  if (!bestDescription && finalResults.length > 0) {
    const primary = finalResults[0];
    const summaryLines = [
      `Le code-barres EAN ${barcode} correspond au produit suivant :`,
      primary.title,
      primary.supplier ? `Marque : ${primary.supplier}` : undefined,
      primary.price ? `Prix indicatif : ${primary.price}` : undefined,
      `Données récupérées via Google AI Mode.`,
    ].filter(Boolean) as string[];
    bestDescription = summaryLines.join('\n');
  }

  return {
    description: bestDescription,
    images: finalImages,
    results: finalResults,
  };
}

export function eanSearchTool(
  dataStream: UIMessageStreamWriter<ChatMessage> | undefined,
  options?: { imageProvider?: EANImageProvider },
) {
  const selectedImageProvider: EANImageProvider = options?.imageProvider ?? 'serpapi';
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
        const { description, images, results } = await fetchGoogleAIProductData(barcode, selectedImageProvider);
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
