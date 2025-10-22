import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'; // adapte le chemin si nécessaire
import { YoutubeIcon } from 'lucide-react'; // or adapt to your local icon

type VideoResult = {
  videoId: string;
  url: string;
  details?: any;
  captions?: string;
  timestamps?: string[];
  views?: string;
  likes?: string;
  summary?: string;
};

export const YouTubeSearchResults: React.FC<{ results: { results: VideoResult[] } | null; isLoading?: boolean }> = ({
  results,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <YoutubeIcon className="h-6 w-6 text-red-600 mx-auto" />
        <div className="mt-2 text-sm">Searching YouTube…</div>
      </div>
    );
  }

  if (!results || !Array.isArray(results.results) || results.results.length === 0) {
    return (
      <div className="p-6 text-center">
        <YoutubeIcon className="h-6 w-6 text-red-600 mx-auto" />
        <div className="mt-2 text-sm">No YouTube results found</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {results.results.map((video) => (
        <div key={video.videoId} className="border p-4 rounded-md bg-white dark:bg-neutral-900">
          <a href={video.url} target="_blank" rel="noreferrer" className="font-semibold text-sm">
            {video.details?.title ?? video.videoId}
          </a>
          <div className="text-xs text-muted mt-1">{video.details?.author_name}</div>
          <div className="mt-2 text-sm">
            {video.captions ? (
              <ScrollArea className="max-h-40">
                <div className="text-sm whitespace-pre-wrap">{video.captions}</div>
              </ScrollArea>
            ) : (
              <div className="text-xs text-muted">No transcript available</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default YouTubeSearchResults;