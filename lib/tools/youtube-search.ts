import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { serverEnv } from '@/env/server';
import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';

interface VideoDetails {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  type?: string;
  provider_name?: string;
  provider_url?: string;
}

interface VideoResult {
  videoId: string;
  url: string;
  details?: VideoDetails;
  captions?: string;
  timestamps?: string[];
  views?: string;
  likes?: string;
  summary?: string;
  publishedDate?: string;
}

interface SubtitleFragment {
  start: string; // seconds as string from API
  dur: string; // seconds as string
  text: string;
}

export const youtubeSearchTool = tool({
  description: 'Search YouTube videos using Exa AI and get detailed video information.',
  inputSchema: z.object({
    query: z.string().describe('The search query for YouTube videos'),
    timeRange: z.enum(['day', 'week', 'month', 'year', 'anytime']),
  }),
  execute: async ({
    query,
    timeRange,
  }: {
    query: string;
    timeRange: 'day' | 'week' | 'month' | 'year' | 'anytime';
  }) => {
    try {
      const exa = new Exa(serverEnv.EXA_API_KEY as string);

      console.log('query', query);
      console.log('timeRange', timeRange);
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      switch (timeRange) {
        case 'day':
          startDate = formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
          endDate = formatDate(now);
          break;
        case 'week':
          startDate = formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
          endDate = formatDate(now);
          break;
        case 'month':
          startDate = formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
          endDate = formatDate(now);
          break;
        case 'year':
          startDate = formatDate(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000));
          endDate = formatDate(now);
          break;
        case 'anytime':
          // Don't set dates for anytime - let Exa use its defaults
          break;
      }

      interface ExaSearchOptions {
        type?: 'auto' | 'neural' | 'keyword' | 'hybrid' | 'fast';
        numResults?: number;
        includeDomains?: string[];
        startPublishedDate?: string;
        endPublishedDate?: string;
      }

      const searchOptions: ExaSearchOptions = {
        type: 'auto',
        numResults: 5,
        includeDomains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
      };

      if (startDate) {
        searchOptions.startPublishedDate = startDate;
      }
      if (endDate) {
        searchOptions.endPublishedDate = endDate;
      }

      console.log('📅 Search date range:', {
        timeRange,
        startDate,
        endDate,
        searchOptions,
      });

      const searchResult = await exa.searchAndContents(query, searchOptions);

      console.log('🎥 YouTube Search Results:', searchResult);

      // Deduplicate videos by ID to avoid redundant API calls
      const uniqueResults = searchResult.results.reduce((acc: Map<string, any>, result: any) => {
        const videoIdMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/?)([^&?\/]+)/);
        const videoId = videoIdMatch?.[1];

        if (videoId && !acc.has(videoId)) {
          acc.set(videoId, result);
        }
        return acc;
      }, new Map());

      const videos: VideoResult[] = [];

      for (const [videoId, result] of uniqueResults.entries()) {
        try {
          // Try to fetch subtitles using youtube-caption-extractor (best-effort)
          let captions: string | undefined;
          let timestamps: string[] | undefined;
          try {
            const subs = await getSubtitles(videoId as string);
            if (subs && Array.isArray(subs) && subs.length > 0) {
              captions = subs.map((s: any) => s.text).join(' ');
              timestamps = subs.map((s: any) => s.start);
            }
          } catch (err) {
            // ignore subtitle extraction errors
          }

          const details = (result as any).openGraph || (result as any).metadata || undefined;

          videos.push({
            videoId: videoId as string,
            url: (result as any).url,
            details,
            captions,
            timestamps,
            views: (result as any).views,
            likes: (result as any).likes,
            publishedDate: (result as any).publishedDate,
          });
        } catch (err) {
          console.warn('Failed to process video', videoId, err);
        }
      }

      return { success: true, results: videos };
    } catch (err: any) {
      console.error('youtubeSearchTool error', err);
      return { success: false, error: err?.message || String(err) };
    }
  },
});
