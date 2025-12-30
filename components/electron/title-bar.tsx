'use client';

import { useElectron } from '@/hooks/use-electron';

export function TitleBar() {
  const { isElectron, appVersion } = useElectron();

  if (!isElectron) return null;

  return (
    <div className="h-8 bg-neutral-900 flex items-center justify-between px-4 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <img src="/hyper.png" alt="Hyper" className="w-4 h-4" />
        <span className="text-xs text-neutral-400">Hyper Desktop {appVersion}</span>
      </div>
      <div className="text-xs text-neutral-500">
        Connecté à Neon Cloud
      </div>
    </div>
  );
}
