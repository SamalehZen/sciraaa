import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './use-local-storage';

export type HomeBackgroundVariant = 'classic' | 'dotscreen';

const STORAGE_KEY = 'scira:home-background-variant';

export function useHomeBackground() {
  const [storedVariant, setStoredVariant] = useLocalStorage<HomeBackgroundVariant>(STORAGE_KEY, 'classic');

  const variant = useMemo<HomeBackgroundVariant>(() => (storedVariant === 'dotscreen' ? 'dotscreen' : 'classic'), [storedVariant]);

  const setVariant = useCallback(
    (next: HomeBackgroundVariant) => {
      setStoredVariant(next);
    },
    [setStoredVariant],
  );

  const enableDotscreen = useCallback(() => setVariant('dotscreen'), [setVariant]);
  const enableClassic = useCallback(() => setVariant('classic'), [setVariant]);

  return {
    variant,
    setVariant,
    enableDotscreen,
    enableClassic,
    isDotscreen: variant === 'dotscreen',
  } as const;
}
