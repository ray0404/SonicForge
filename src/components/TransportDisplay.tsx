import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';

export const TransportDisplay: React.FC = () => {
    // Select only what we need for the display loop
    const currentTime = useAudioStore(state => state.currentTime);
    const sourceDuration = useAudioStore(state => state.sourceDuration);
    const hasSource = sourceDuration > 0;

    // We need seek from store, but seek function reference is stable, so it won't cause re-renders.
    // However, Zustand hook returns a new slice if we don't return primitives/memoized objects.
    // So we pick 'seek' separately or in a shallow object if we want.
    // Since 'seek' is an action, it likely doesn't change.
    const seek = useAudioStore(state => state.seek);

    // Format helper duplicated for isolation (or could be moved to utils)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    return (
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex justify-between items-end px-1">
             <span className="font-mono text-sm font-bold text-slate-200 tracking-wider">
                {formatTime(currentTime)}
             </span>
             <span className="font-mono text-[10px] text-slate-500">
                {formatTime(sourceDuration)}
             </span>
          </div>
          <div className="relative h-6 group flex items-center">
             <input
                  type="range"
                  aria-label="Seek"
                  min={0}
                  max={sourceDuration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!hasSource}
                  className="peer absolute inset-0 w-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
             {/* Custom Range Track */}
             <div className="absolute left-0 right-0 h-1.5 bg-slate-800 rounded-full overflow-hidden peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900 transition-shadow">
                 <div
                    className="h-full bg-primary transition-all duration-75"
                    style={{ width: `${(currentTime / (sourceDuration || 1)) * 100}%` }}
                 />
             </div>
          </div>
      </div>
    );
};
