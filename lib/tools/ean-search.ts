import { tool } from 'ai';
import { z } from 'zod';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '../types';
import { serverEnv } from '@/env/server';

const SERPER_API_KEY = serverEnv.SERPER_API_KEY;
const SERPER_SEARCH_ENDPOINT = 'https://google.serper.dev/search';
const SERPER_IMAGES_ENDPOINT = 'https://google.serper.dev/images';

interface SerperSearchResult {
  organic?: Array<{
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }>;
  images?: Array<string | { imageUrl: string; link: string; source?: string }>;
  knowledgeGraph?: {
    title?: string;
    description?: string;
    descriptionSource?: string;
    descriptionLink?: string;
    attributes?: Record<string, string>;
    imageUrl?: string;
    images?: Array<string | { url: string; link: string }>;
  };
}

async function searchSerper(query: string, num: number = 10): Promise<SerperSearchResult> {
  const response = await fetch(SERPER_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num,
      gl: 'fr',
      hl: 'fr',
      type: 'search', // Ensure we get all results including images
      autocorrect: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const result = (await response.json()) as SerperSearchResult;
  console.log(`[Serper] Query: "${query}" - Found ${result.organic?.length || 0} results, ${result.images?.length || 0} images`);
  
  return result;
}

async function searchSerperImages(query: string, num: number = 20): Promise<{ images?: Array<{ imageUrl: string; link: string; title?: string }> }> {
  try {
    const response = await fetch(SERPER_IMAGES_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num,
        gl: 'fr',
        hl: 'fr',
      }),
    });

    if (!response.ok) {
      console.warn(`Serper Images API error: ${response.status}`);
      return { images: [] };
    }

    const result = await response.json();
    console.log(`[Serper Images] Query: "${query}" - Found ${result.images?.length || 0} images`);
    
    return result;
  } catch (error) {
    console.warn('[Serper Images] Failed to fetch images:', error);
    return { images: [] };
  }
}

// No domain filtering - accept ALL results from Serper
const hostToBrandFallback: Record<string, string> = {
  'www.barcodelookup.com': 'Barcode Lookup',
  'barcodelookup.com': 'Barcode Lookup',
  'go-upc.com': 'Go-UPC',
  'www.gs1.org': 'GS1',
  'www.eandata.com': 'EANData',
  'www.upcindex.com': 'UPC Index',
  'www.carrefour.fr': 'Carrefour',
  'carrefour.fr': 'Carrefour',
  'carrefour-express.fr': 'Carrefour Express',
  'fr.openfoodfacts.org': 'Open Food Facts',
  'world.openfoodfacts.org': 'Open Food Facts',
  'amazon.fr': 'Amazon',
  'www.amazon.fr': 'Amazon',
  'www.auchan.fr': 'Auchan',
  'auchan.fr': 'Auchan',
  'www.leclerc.com': 'Leclerc',
  'leclerc.com': 'Leclerc',
  'www.intermarche.com': 'Intermarché',
  'intermarche.com': 'Intermarché',
}

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function deriveBrand(title: string, content: string, hostname: string | null): string | undefined {
  const haystack = `${title}\n${content}`.split(/\n|\.|\r/);
  for (const segment of haystack) {
    const match = segment.match(/\b(?:brand|marque)\s*[:\-]\s*([^\n\r]+)/i);
    if (match) {
      const raw = match[1].trim();
      if (raw) {
        return raw.replace(/\s{2,}/g, ' ');
      }
    }
  }

  if (hostname) {
    const fallback = hostToBrandFallback[hostname] || hostToBrandFallback[hostname.replace(/^www\./, '')];
    if (fallback) {
      return fallback;
    }
  }

  const titleMatch = title.match(/^[^|-]+/);
  if (titleMatch) {
    const possible = titleMatch[0].trim();
    if (possible && possible.length <= 40) {
      return possible;
    }
  }

  return undefined;
}

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
  description?: string;
};

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
        const searchQuery = `EAN ${barcode}`;

        // Run both text and image searches in parallel
        const [serperResults, imageResults] = await Promise.all([
          searchSerper(searchQuery, 20),
          searchSerperImages(searchQuery),
        ]);

        const collectedResults: ProductSearchResult[] = [];
        const collectedImages: string[] = [];

        // Collect images from dedicated image search first (best quality)
        if (imageResults.images && Array.isArray(imageResults.images)) {
          imageResults.images.forEach((img) => {
            if (img && typeof img === 'object' && 'imageUrl' in img) {
              collectedImages.push(img.imageUrl);
            } else if (typeof img === 'string') {
              collectedImages.push(img);
            }
          });
          console.log(`[EAN Search] Collected ${imageResults.images.length} images from dedicated image search`);
        }

        // Accept ALL organic results from Serper (no domain filtering)
        if (serperResults.organic) {
          for (const result of serperResults.organic) {
            const url = result.link;
            const hostname = url ? getHostname(url) : null;
            const content = result.snippet || '';
            const brand = deriveBrand(result.title || '', content, hostname);

            collectedResults.push({
              title: result.title || '',
              url,
              content,
              images: [],
              supplier: brand || undefined,
              ean: barcode,
              publishedDate: result.date || undefined,
            });
          }
        }

        // Collect images from Knowledge Graph first (higher quality)
        if (serperResults.knowledgeGraph?.imageUrl) {
          collectedImages.push(serperResults.knowledgeGraph.imageUrl);
        }

        // Collect images from Knowledge Graph array
        if (serperResults.knowledgeGraph?.images && Array.isArray(serperResults.knowledgeGraph.images)) {
          serperResults.knowledgeGraph.images.forEach((img) => {
            if (typeof img === 'string') {
              collectedImages.push(img);
            } else if (img && typeof img === 'object' && 'url' in img) {
              collectedImages.push(img.url);
            }
          });
        }

        // Collect images from main search results
        if (serperResults.images && Array.isArray(serperResults.images)) {
          serperResults.images.forEach((img) => {
            if (typeof img === 'string') {
              collectedImages.push(img);
            } else if (img && typeof img === 'object' && 'imageUrl' in img) {
              collectedImages.push(img.imageUrl);
            }
          });
        }

        const seenUrls = new Set<string>();
        const finalResults: ProductSearchResult[] = [];
        for (const result of collectedResults) {
          if (!result.url || seenUrls.has(result.url)) continue;
          seenUrls.add(result.url);
          finalResults.push(result);
        }

        // Deduplicate and filter valid images (must be proper URLs)
        const finalImages = Array.from(new Set(collectedImages))
          .filter(img => {
            try {
              new URL(img);
              return true;
            } catch {
              return false;
            }
          })
          .slice(0, 12);

        console.log(`[EAN Search] Found ${collectedImages.length} images (${finalImages.length} after filtering) for barcode ${barcode}`);

        // Build description from Knowledge Graph
        let fullDescription = '';

        if (serperResults.knowledgeGraph) {
          const kg = serperResults.knowledgeGraph;
          if (kg.title) {
            fullDescription += `${kg.title}\n\n`;
          }
          if (kg.description) {
            fullDescription += `${kg.description}\n\n`;
          }
          if (kg.attributes) {
            Object.entries(kg.attributes).forEach(([key, value]) => {
              fullDescription += `${key}: ${value}\n`;
            });
            fullDescription += '\n';
          }
        }

        if (finalResults.length === 0 && finalImages.length === 0 && !fullDescription) {
          return {
            barcode,
            results: [],
            images: [],
            totalResults: 0,
            message: 'Aucun résultat trouvé pour ce code-barres.',
          } as const;
        }

        // Limit to top 8 results
        finalResults.splice(8);

        // Add content from top results to description
        finalResults.slice(0, 3).forEach((result) => {
          if (result.content) {
            fullDescription += `${result.content}\n\n`;
          }
        });

        return {
          barcode,
          results: finalResults,
          images: finalImages,
          totalResults: finalResults.length,
          description: fullDescription.trim() || undefined,
          message: `Found ${finalResults.length} results for barcode ${barcode}`,
        };
      } catch (err) {
        console.error('[EAN Search] Error:', err);
        return {
          barcode,
          results: [],
          images: [],
          totalResults: 0,
          description: undefined,
          message: 'Erreur lors de la recherche du code-barres.',
          error: (err as Error)?.message || 'Unknown error',
        } as const;
      }
    },
  });
}
